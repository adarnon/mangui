
function copycmd() {
    console.log('Copying bash command to clipboard...');
    let bash = document.getElementById('bash').value;
    navigator.clipboard.writeText(bash);
}

function onChange() {
    updateBash();
}

function updateBash() {
    let opts = document.querySelectorAll('.opt');
    let res = [];
    for (const o of opts) {
        if (o.type == 'checkbox') {
            if (o.checked) {
                res.push(o.getAttribute('data-name'));
            }
        } else if (o.type == 'text') {
            let s = o.value.trim();
            if (s) {
                res.push(o.getAttribute('data-name') + '=' + s);
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
