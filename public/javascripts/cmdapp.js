document.addEventListener('DOMContentLoaded', (event) => {
    runCmd();
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

    document.getElementById('output').value = outjson.stdout;
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
    let argsElem = document.getElementById('args');
    let choices = document.querySelectorAll('input.choice');

    let res = [];

    iterOpts((x) => {
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
    })

    let argsVal = argsElem.value.trim();
    if (argsVal) {
        res.push(argsVal);
    }

    if (res.length == 0) {
        bashElem.value = '';
    } else {
        res.unshift(bashElem.getAttribute('data-alias'));
        bashElem.value = res.join(' ');
    }
}

function iterOpts(cb) {
    let choices = document.querySelectorAll('input.choice');
    for (const x of choices) {
        cb(x);
    }
}
