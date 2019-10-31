# Dependencies
Import-Module .\Uptime.ps1

$MonitorCode = @"
using System;
using System.Collections; 
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Diagnostics;
using System.ComponentModel;
public class WindowMonitor {
    private IntPtr _hook = IntPtr.Zero;
    private WinEventDelegate _delegate = null;
    private int _nCalls = 0;
    private List<Tuple<Process, uint>> _changes = new List<Tuple<Process, uint>>();

    public IntPtr Hook { get { return _hook; } }
    public WinEventDelegate Delegate { get { return _delegate; } }
    public int NCalls { get { return _nCalls; } }
    public List<Tuple<Process, uint>> Changes { get { return _changes; } }


    // SetWinEventHook consts
    private const uint WINEVENT_OUTOFCONTEXT = 0;
    private const uint EVENT_SYSTEM_FOREGROUND = 3;

    // Function types
    public delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild,
    uint dwEventThread, uint dwmsEventTime);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);
    [DllImport("user32.dll", SetLastError = true)]
    static extern bool UnhookWinEvent(IntPtr hWinEventHook);
    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr GetForegroundWindow(); // XXX MIGHT NOT NEED THIS
    [DllImport("user32.dll", SetLastError = true)]
    public static extern int GetWindowThreadProcessId(IntPtr hWnd, out uint ProcessId);

    public class WinEventHookException : Exception
    {
        public WinEventHookException() : base() { }
        public WinEventHookException(string message) : base(message) { }
    }

    public WindowMonitor() { }

    public void Enable() {
        _delegate = new WinEventDelegate(WinEventProc);
        _hook = SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, IntPtr.Zero, _delegate, 0, 0, WINEVENT_OUTOFCONTEXT);

        if (IntPtr.Zero == _hook) {
            _delegate = null;
            throw new WinEventHookException("Error when setting Windows event hook.");
        }
    }

    public void Disable() {
        UnhookWinEvent(_hook);
        _hook = IntPtr.Zero;
        _delegate = null;
    } 

    private void WinEventProc(IntPtr hWinEventHook, uint dwEvent, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime)
    {
        if (dwEvent == EVENT_SYSTEM_FOREGROUND) {
            ++_nCalls;
            onFgChange(hwnd, dwmsEventTime);
        }
    }

    private void onFgChange(IntPtr wnd, uint eventTime) {
        uint pid = 0;
        int tid = GetWindowThreadProcessId(wnd, out pid);
        Process proc = Process.GetProcessById((int) pid);
        _changes.Add(new Tuple<Process, uint>(proc, eventTime));
    }
}
"@

$null = Add-Type $MonitorCode -PassThru
$monitor = New-Object WindowMonitor

# Do the monitoring
# XXX Known bug: last process will be missing
$monitor.Enable()
Read-Host -Prompt "Press ENTER when done"
$doneTimestamp = (Get-Uptime).Uptime.TotalMilliseconds # XXX Probably won't use this
Start-Sleep -Seconds 3 # XXX Race condition: must let message pump clear all messages before calling Disable()
$monitor.Disable()

# Transform to a named tuple array
$changes = @()
$monitor.Changes | ForEach-Object { $changes += New-Object PSObject -Property @{Process=$_.Item1;Time=$_.Item2}  }

# Analyze!
$seen = @{} # Whether we've seen this process before
$countTime = @{} # Aggregate time counter
$countSwitches = @{} # Switch counter
foreach ($i in (1..($changes.Count - 2))) { # -2 since we're always looking one change forward
    $curr = $changes[$i]
    $pname = $curr.Process.ProcessName
    $next = $changes[$i + 1]

    if (-Not ($seen.ContainsKey($pname))) {
        $seen[$pname] = $true
        $countTime[$pname] = 0
        $countSwitches[$pname] = 0
    }

    # Time
    $addTime = $next.Time - $curr.Time
    $countTime[$pname] += $addTime

    # Switches
    ++$countSwitches[$pname]
}
Write-Host ("Time spent by process: {0}" -f ($countTime | Out-String))
Write-Host ("Switches: {0}" -f ($countSwitches | Out-String))

# Output row
# Timestamp, Chrome Time, Chrome Switches, Ubuntu Time, Ubuntu Switches
$row = New-Object System.Object
$row | Add-Member -MemberType NoteProperty -Name "time" -Value $(Get-Date -Format FileDateTimeUniversal)
@("chrome", "ubuntu") | ForEach-Object {
    $row | Add-Member -MemberType NoteProperty -Name "$($_)_time" -Value $countTime[$_]
    $row | Add-Member -MemberType NoteProperty -Name "$($_)_switches" -Value $countSwitches[$_]
}

# Export!
$row | Export-Csv -Append -Path "monitor.csv" -NoTypeInformation
