const fs = require('fs');

class TutorialParser {
    constructor(file) {
        this.file = file;
    }

    parse(playgroundURL, restURL) {
        let file = fs.readFileSync(this.file).toString();

        let tutorial = [];
        
        let sections = [];

        file = file.split('\n');
        
        // GET PAGES
        file.forEach((element, index) => {
            if (element.substr(0, 2) === '# ') {
                sections.push(index);
            }
        });

        sections = sections.map((i, index) => {
            let finish = sections[index+1];
            if (typeof finish === 'undefined') {
                finish = file.length;
            }
            return file.slice(i+1, finish);
        });

        sections.forEach((el, sectionIndex) => {
            let page = {steps: [], notifications: []};
            let subsections = [];

            el.forEach((line, index) => {
                if (line.substr(0, 3) === '## ') {
                    subsections.push(index);
                }
            });

            subsections = subsections.map((i, index) => {
                let finish = subsections[index+1];
                if (typeof finish === 'undefined') {
                    finish = el.length;
                }
                return el.slice(i, finish).filter((line) => {
                    return line !== '';
                });
            })

            subsections.forEach((subsection) => {
                let step = {};
                step.title = subsection[0].replace('## ', '');
                let text = [];
                let hidden = [];

                subsection.splice(0, 1);

                subsection.forEach((line) => {

                    line = line.replace(/%PLAYGROUND_URL%/, playgroundURL || 'http://localhost:8080');
                    line = line.replace(/%REST_SERVER_URL%/, restURL || 'http://localhost:3000');

                    if(line.substr(0, 6) !== '[//]: ') {
                        let linkRegEx = /\[.*?\]\(.*?\)/g;
                        
                        if (linkRegEx.test(line)) {
                            let matches = line.match(linkRegEx);
                            matches.forEach((match) => {
                                const linkText = match.substring(1, match.lastIndexOf(']'));
                                const linkLocation = match.substring(match.indexOf('(')+1, match.length-1);
                                line = line.replace(match, `<a target="_blank" href="${linkLocation}" >${linkText}</a>`);
                            })
                        }

                        text.push(line);
                    } else {
                        let inBrackets = line.match(/\(([^)]+)\)/)[1];
                        inBrackets = inBrackets.substring(1, inBrackets.length-1); // REMOVE QUOTES

                        const inBracketsAsArray = inBrackets.split('|').map((el) => { return el.trim(); });
                        const type = inBracketsAsArray[0];

                        if (type === 'INLINE_BUTTON') {
                            const buttonText = inBracketsAsArray[1];
                            const call = this.parseFunctionSet(inBracketsAsArray.slice(2).join('|'));
                            
                            text.push(`<button ng-click="${call}" >${buttonText}</button>`);
                        } else {
                            hidden.push(inBrackets);
                        }
                    }
                });
                
                step.text = text.join('<br /><br />');
                step.complete = false;


                step.listeners = [];

                hidden.forEach((line) => {
                    const lineAsArray = line.split('|').map((el) => { return el.trim(); });
                    const type = lineAsArray[0];

                    if (type === 'LISTENER') {
                        step.listeners.push(this.parseListener(lineAsArray));
                    } else if (type === 'BUTTON') {
                        let button = {
                            text: lineAsArray[1],
                            navigateTo: lineAsArray[2],
                            disabled: true,
                            enablementRule: this.parseRuleSet(lineAsArray.slice(3).join('|'))
                        }

                        if(Object.keys(button.enablementRule).length === 0 && button.enablementRule.constructor === Object) {
                            button.disabled = false;
                            delete button.enablementRule;
                        }

                        page.button = button
                    } else if (type === "NOTIFICATION") {
                        
                        let destroyed_position;
                        lineAsArray.some((el, index) => {
                            if(el.includes('DESTROY_WHEN')) {
                                destroyed_position = index;
                                return;
                            }
                        })

                        let notification = {
                            title: lineAsArray[1],
                            text: lineAsArray[2],
                            vertical: lineAsArray[3],
                            horizontal: lineAsArray[4],
                            createWhen: this.parseRuleSet(lineAsArray.slice(5, destroyed_position).join('|')),
                            destroyWhen: this.parseRuleSet(lineAsArray.slice(destroyed_position).join('|')),
                        }

                        if (notification.title === "") {
                            delete notification.title
                        } 

                        if (Object.keys(notification.createWhen).length === 0 && notification.createWhen.constructor === Object) {
                            delete notification.createWhen;
                        }

                        if (Object.keys(notification.destroyWhen).length === 0 && notification.destroyWhen.constructor === Object) {
                            delete notification.destroyWhen;
                        }

                        page.notifications.push(notification);

                    } else {
                        throw new Error(`${type} is not a valid type for a hidden value, must be BUTTON or LISTENER`)
                    }
                })

                page.steps.push(step);
            });
            tutorial.push(page)
        })

        return tutorial;
    }

    parseListener(listenerAsArray) {
        let listener;
        if(listenerAsArray[1] !== 'SCOPE') {
            listener = {
                type: listenerAsArray[1],
                iFrame: listenerAsArray[2],
                element: listenerAsArray[3],
                listenFor: listenerAsArray[4]
            }

            if (listener.iFrame === '') {
                delete listener.iFrame;
            }
        } else {
            listener = {
                type: listenerAsArray[1],
                variable: listenerAsArray[3],
                comparison: listenerAsArray[2],
                value: listenerAsArray[4]
            }
        }

        return listener;

    }

    parseFunctionSet(func) {
        func = func.replace('FUNCTION =>', '');
        func = func.trim();
        
        if (func.charAt(0) !== '[' || func.slice(-1) !== ']') {
            throw new Error('Invalid function defintion');
        }

        func = func.slice(1, -1);

        let funcAsArray = func.split('|');

        let functionName = funcAsArray[0].trim();

        let args = funcAsArray.slice(1).join('|');
        args = args.replace('ARGS =>', '');
        args = args.trim();

        if (args.charAt(0) !== '[' || args.slice(-1) !== ']') {
            throw new Error('Invalid args defintion');
        }

        args = args.slice(1, -1);
        args = args.split('|');

        let call = `${functionName}(${args.join(',').trim()})`

        return call;
    }

    parseRuleSet(rules, expected_type) {
        rules = rules.replace('ENABLEMENT_RULE =>', ''); // Strip out button preface
        rules = rules.replace('CREATE_WHEN =>', ''); // Strip out notification create preface
        rules = rules.replace('DESTROY_WHEN =>', ''); // Strip out notification remove preface
        rules = rules.trim();

        if(rules === "[]") {
            return {};
        }

        let rulesAsString = rules;

        rules = rules.split('=>').join(' | ');
        rules = rules.split('|').map((el) => {
            let lastOpen = el.lastIndexOf('[') === -1 ? -1 : el.lastIndexOf('[');
            let firstClose = el.indexOf(']') === -1 ? el.length : el.indexOf(']');
            return el.substring(0, lastOpen+1) + '"' + el.substring(lastOpen+1, firstClose) + '"' + el.substring(firstClose, el.length);
        })
        rules = rules.join(',');

        rules = JSON.parse(rules).map((el) => {
            if(typeof el === 'string') {
                return el.trim();
            } 
            return el;
        })

        let connectionPosition;

        let jsonRule;

        if (rules[0] === 'REST_EVENT') {
            connectionPosition = 4;
            jsonRule = {
                rule_type: 'REST_EVENT',
                key: rules[1],
                value: rules[3],
                comparison: rules[2]
            };

        } else if (rules[0] === 'LISTENER') {
            connectionPosition = 5;
            jsonRule = Object.assign({
                rule_type: 'LISTENER',
                complete: false
            }, this.parseListener(rules));
        } else {
            throw new Error(`${rules[0]} is not a valid type for rule type. Must be REST_EVENT or LISTENER`)
        }

        if (expected_type && expected_type !== jsonRule.rule_type) {
            throw new Error('You cannot mix and match rule types')
        }

        if (rulesAsString.includes('=>')) {
            jsonRule.combineWith = {
                connection: rules[connectionPosition],
                rule: this.parseRuleSet(rulesAsString.substring(rulesAsString.indexOf('=>')+2, rulesAsString.length-1).trim()) // GET RULE TO CONNECT WITH BY SENDING WHAT WAS IN THE SQUARE BRACKETS FOR THIS RULE BACK
            }
        }

        return jsonRule;
    }
}

module.exports = TutorialParser