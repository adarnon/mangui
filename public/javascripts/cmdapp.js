document.addEventListener('DOMContentLoaded', (event) =>{
    runcmd();
})

function getbash() {
    return document.getElementById('bash').value;
}

function copycmd() {
    console.log('Copying bash command to clipboard...');
    navigator.clipboard.writeText(getbash());
}

async function runcmd() {
    const response = await fetch('/run', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cmd: getbash()})
    });
    const outjson = await response.json();

    document.getElementById('output').value = outjson.stdout;
}

function search(searchbox) {
    let query = searchbox.value.trim();

    let opts = document.querySelectorAll('tr.opt');
    for (const x of opts) {
        if (showOpt(x, query)) {
            x.style.display = '';
        } else {
            x.style.display = 'none';
        }
    }
}

function showOpt(opt, query) {
    if (!query) {
        return true;
    }

    query = query.toLowerCase();

    let srch = opt.querySelectorAll(':scope .srch');
    for (const x of srch) {
        let val = x.innerText;
        if (val.toLowerCase().includes(query)) {
            return true;
        }
    }

    return false;
}

function onChange() {
    updateBash();
    runcmd();
}

function updateBash() {
    let bashElem = document.getElementById('bash');
    let choices = document.querySelectorAll('input.choice');
    let res = [bashElem.getAttribute('data-alias')];
    for (const x of choices) {
        if (x.type == 'checkbox') {
            if (x.checked) {
                res.push(x.getAttribute('data-name'));
            }
        } else if (x.type == 'text') {
            let s = x.value.trim();
            if (s) {
                res.push(x.getAttribute('data-name') + '=' + s);
            }
        }
    }

    bashElem.value = res.join(' ');
}
