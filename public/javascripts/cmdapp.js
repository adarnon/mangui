document.addEventListener('DOMContentLoaded', (event) => {
    onChange();
});

function getCmd() {
    let bashElem = document.getElementById('bash');

    let bash = bashElem.value.trim();
    if (!bash) {
        return bashElem.getAttribute('data-alias');
    }

    return bash;
}

function resetForm() {
    let form = document.getElementById('cmdform');

    form.reset();
    let lbls = document.querySelectorAll('label.choice-lbl');
    for (let x of lbls) {
        x.classList.remove('active');
    }

    onChange();
}

function copyCmd() {
    console.log('Copying bash command to clipboard...');
    navigator.clipboard.writeText(getCmd());
}

async function runCmd() {
    const response = await fetch('/run', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cmd: getCmd() })
    });
    const outjson = await response.json();

    let outputElem = document.getElementById('output');
    if (outjson.stderr) {
        outputElem.value = outjson.stderr;
        outputElem.style.color = '#FF0000';
    } else {
        outputElem.value = outjson.stdout;
        outputElem.style.color = '#00FF00';
    }
}

function searchOpt(searchbox) {
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
    runCmd();
}

function updateBash() {
    let bashElem = document.getElementById('bash');
    let builtElem = document.getElementById('built');
    let argsElem = document.getElementById('args');
    let choices = document.querySelectorAll('input.choice');
    let alias = bashElem.getAttribute('data-alias');

    let res = [];
    let builtRes = [createOptElem(null, alias, null)];

    iterOpts((x) => {
        if (x.type == 'checkbox') {
            if (x.checked) {
                let name = x.getAttribute('data-name');
                res.push(name);
                builtRes.push(createOptElem(x, name, (event) => {
                    x.checked = false;

                    let changeEvt = new Event('change');
                    x.dispatchEvent(changeEvt);
                }));
            }
        } else if (x.type == 'text') {
            let s = x.value.trim();
            if (s) {
                let name = x.getAttribute('data-name') + '=' + s;
                res.push(name);
                builtRes.push(createOptElem(x, name, (event) => {
                    x.value = '';

                    let changeEvt = new Event('keyup');
                    x.dispatchEvent(changeEvt);
                }));
            }
        }
    })

    let argsVal = argsElem.value.trim();
    if (argsVal) {
        res.push(argsVal);
    }

    if (res.length == 0) {
        bashElem.value = '';
    } else {
        res.unshift(alias);
        bashElem.value = res.join(' ');
    }

    while (builtElem.firstChild) {
        builtElem.removeChild(builtElem.firstChild);
    }
    for (let x of builtRes) {
        builtElem.appendChild(x);
    }
}

function createOptElem(x, name, closeCb) {
    let e = document.createElement('text');
    e.classList.add('text-monospace');
    e.classList.add('form-control');
    e.classList.add('bg-info');
    e.classList.add('opt-elem');
    e.innerText = name;

    if (closeCb) {
        let times = document.createElement('span');
        times.classList.add('close');
        times.classList.add('pl-2');
        times.innerHTML = '&times;';
        times.onclick = closeCb;

        e.appendChild(times);
    }

    return e;
}

function iterOpts(cb) {
    let choices = document.querySelectorAll('input.choice');
    for (const x of choices) {
        cb(x);
    }
}
