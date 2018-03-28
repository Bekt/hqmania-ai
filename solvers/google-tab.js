const cp = require('child_process');
const fs = require('fs');


const Q = 'https://www.google.com/search?q='
const chromeArgs = [
    '--incognito', '--new-window', '--no-experiments',
    '--disable-plugins', '--no-first-run', '-no-pings'
];
const cmd = `open -a "Google Chrome" -n ${chromeArgs.map(a => `--args ${a}`).join(' ')}`;


exports.answer = (question) => {
    let answers = question.answers;
    let [tabWidth, tabHeight] = [Math.floor(1800 / answers.length), 900];
    let userDir = '/tmp/hqmania/chrome/';
    for (let i = 0; i < answers.length; i++) {
        let exec = `${cmd} \
            --args --user-data-dir=${userDir}${i} \
            --args --window-position=${i * tabWidth},0 \
            --args --window-size=${tabWidth},${tabHeight} \
            \"${Q}${question.question}+${answers[i].text}\"`;
        cp.exec(exec);
    }
};
