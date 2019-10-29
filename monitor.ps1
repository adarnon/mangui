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

    // Structs
    [StructLayout(LayoutKind.Sequential)]
    public struct MSG
    {
        public IntPtr hwnd;
        public uint message;
        public IntPtr wParam;
        public IntPtr lParam;
        public uint time;
    }

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
    [DllImport("user32.dll", SetLastError = true)]

    // XXX DELETE THIS
    public static extern int GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);
    [DllImport("user32.dll", SetLastError = true)]
    static extern bool TranslateMessage([In] ref MSG lpMsg);
    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr DispatchMessage([In] ref MSG lpmsg);

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

    // XXX DELETE THIS
    public void Run() {
        MSG msg;
        int ret;
        while ((ret = GetMessage(out msg, IntPtr.Zero, 0, 0)) != 0) {
            if (ret > 0) {
                TranslateMessage(ref msg);
                DispatchMessage(ref msg);
            }
            ret = 0;
        }
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

$monitorType = Add-Type $MonitorCode -PassThru

$monitor = New-Object WindowMonitor

#Read-Host -Prompt "Press Enter to exit"
