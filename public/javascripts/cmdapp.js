
function copycmd() {
    console.log('Copying bash command to clipboard...');
    let bash = document.getElementById('bash').value;
    navigator.clipboard.writeText(bash);
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
}

function updateBash() {
    let choices = document.querySelectorAll('input.choice');
    let res = [];
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


    let resStr = '';
    if (res.length > 0) {
        resStr = ' ' + res.join(' ');
    }

    let bashElem = document.getElementById('bash');
    bashElem.value = bashElem.getAttribute('data-alias') + resStr;
}
