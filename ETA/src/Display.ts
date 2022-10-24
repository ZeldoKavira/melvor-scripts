import {EtaSkill} from "./EtaSkill";
import {ActionCounter} from "./ActionCounter";
import {DisplayManager} from "./DisplayManager";
import {ETASettings} from "./Settings";
import {Bank} from "../../Game-Files/built/bank2";
import {ItemRegistry} from "../../Game-Files/built/namespaceRegistry";

export class Display {
    public readonly container!: HTMLElement;
    public readonly element!: HTMLElement;
    protected readonly manager: DisplayManager;
    protected readonly settings: ETASettings;
    protected readonly bank: Bank;
    protected readonly items: ItemRegistry;
    protected readonly formatNumber: (_: any) => string;

    constructor(manager: DisplayManager, settings: ETASettings, bank: Bank, items: ItemRegistry, id: string) {
        this.manager = manager;
        this.settings = settings;
        this.bank = bank;
        this.items = items;
        // create and store container
        this.container = this.displayContainer(id);

        this.element = this.container.firstChild as HTMLElement;
        // @ts-ignore
        this.formatNumber = formatNumber;
    }

    addMSToDate(date: Date, ms: number) {
        return new Date(date.getTime() + ms);
    }

    // Format date 24 hour clock
    dateFormat(now: Date, then: Date, is12h = this.settings.get('IS_12H_CLOCK')) {
        let format = {weekday: "short", month: "short", day: "numeric"};
        // @ts-ignore
        let date = then.toLocaleString(undefined, format);
        // @ts-ignore
        if (date === now.toLocaleString(undefined, format)) {
            date = "";
        } else {
            date += " at ";
        }
        let hours: number | string = then.getHours();
        let minutes: number | string = then.getMinutes();
        // convert to 12h clock if required
        let amOrPm = '';
        if (is12h) {
            amOrPm = hours >= 12 ? 'pm' : 'am';
            hours = (hours % 12) || 12;
        } else {
            // only pad 24h clock hours
            hours = hours < 10 ? '0' + hours : hours;
        }
        // pad minutes
        minutes = minutes < 10 ? '0' + minutes : minutes;
        // concat and return remaining time
        return date + hours + ':' + minutes + amOrPm;
    }

    injectHTML(result: EtaSkill, now: Date) {
        if (this.element === null) {
            return undefined;
        }
        this.element.style.display = 'block';
        const rates = this.settings.get('CURRENT_RATES') ? result.currentRates.hourlyRates : result.averageRates.hourlyRates;
        this.element.textContent = "";
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent = "Xp/h: " + this.formatNumber(Math.floor(rates.xp));
            if (result.skill.hasMastery) {
                this.element.textContent += "\r\nMXp/h: " + this.formatNumber(Math.floor(rates.mastery))
                    + `\r\nPool/h: ${result.computePoolProgress(rates.pool).toFixed(2)}%`
            }
        }
        if (this.settings.get('SHOW_ACTION_TIME')) {
            this.element.textContent += "\r\nAction time: " + this.formatNumber(Math.ceil(rates.ms) / 1000) + 's';
            this.element.textContent += "\r\nActions/h: " + this.formatNumber(Math.round(100 * 3.6e6 / rates.ms) / 100);
        }
        const itemID = result.action.product.id;
        const item = this.items.getObjectByID(itemID);
        const youHaveElementId = this.element.id + "-YouHave";
        const youHaveElement = document.getElementById(youHaveElementId);
        if (item !== undefined && youHaveElement !== null) {
            youHaveElement.style.display = 'block';
            while (youHaveElement.lastChild) {
                youHaveElement.removeChild(youHaveElement.lastChild);
            }
            const span = document.createElement('span');
            span.textContent = `You have: ${this.formatNumber(this.bank.getQty(item))}`;
            youHaveElement.appendChild(span);
            const img = document.createElement('img');
            img.classList.add('skill-icon-xs');
            img.classList.add('mr-2');
            img.src = item.media;
            youHaveElement.appendChild(img);
            // add perfect item for cooking // TODO refactor
            const perfectID = itemID + '_Perfect';
            const perfectItem = this.items.getObjectByID(perfectID);
            if (perfectItem !== undefined) {
                const perfectSpan = document.createElement('span');
                perfectSpan.textContent = `You have: ${this.formatNumber(this.bank.getQty(perfectItem))}`;
                youHaveElement.appendChild(perfectSpan);
                const perfectImg = document.createElement('img');
                img.classList.add('skill-icon-xs');
                img.classList.add('mr-2');
                perfectImg.src = perfectItem.media;
                youHaveElement.appendChild(perfectImg);
            }
        }
        this.element.style.display = "block";
        if (this.element.textContent.length === 0) {
            this.element.textContent = "Melvor ETA";
        }
        this.generateTooltips(result, now);
        return this.element;
    }

    generateTooltips(result: EtaSkill, now: Date, flags = {
        noSkill: false,
        noMastery: false,
        noPool: false
    }) {
        // Generate progression Tooltips
        // @ts-ignore
        if (this.element._tippy === undefined) {
            // @ts-ignore
            tippy(this.element, {
                allowHTML: true,
                interactive: false,
                animation: false,
            });
        }
        let tooltip = '';
        // level tooltip
        if (!flags.noSkill) {
            const finalLevel = result.xpToLevel(result.skillXp)
            const levelProgress = this.getPercentageInLevel(result, result.skillXp, result.skillLevel, "skill");
            tooltip += this.finalLevelElement(
                'Final Level',
                this.formatLevel(finalLevel, levelProgress) + ' / 99',
                'success',
            ) + this.tooltipSection(result.actionsTaken.skill, now, result.targets.skillLevel, '');
        }
        // mastery tooltip
        if (!flags.noMastery) {
            const finalLevel = result.xpToLevel(result.masteryXp)
            const levelProgress = this.getPercentageInLevel(result, result.masteryXp, result.masteryLevel, "mastery");
            tooltip += this.finalLevelElement(
                'Final Mastery',
                this.formatLevel(finalLevel, levelProgress) + ' / 99',
                'success',
            ) + this.tooltipSection(result.actionsTaken.mastery, now, result.targets.masteryLevel, '');
        }
        // pool tooltip
        if (!flags.noPool) {
            tooltip += this.finalLevelElement(
                'Final Pool XP',
                result.poolProgress.toFixed(2) + '%',
                'warning',
            )
            let prepend = ''
            /* TODO
            const tokens = Math.round(result.tokens);
            if (tokens > 0) {
                prepend += `Final token count: ${tokens}`;
                if (ms.pool > 0) {
                    prepend += '<br>';
                }
            }
             */
            tooltip += this.tooltipSection(result.actionsTaken.pool, now, `${result.targets.poolPercent}%`, prepend);
        }
        // wrap and return
        // @ts-ignore
        this.element._tippy.setContent(`<div>${tooltip}</div>`);
    }

    getPercentageInLevel(result: EtaSkill, currentXp: number, level: number, type: string): number {
        const currentLevel = level;
        if (currentLevel >= 99 && type === "mastery") {
            // mastery is capped at 99
            return 0;
        }
        const currentLevelXp = result.levelToXp(currentLevel);
        const nextLevelXp = result.levelToXp(currentLevel + 1);
        // progress towards next level
        return (currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp) * 100;
    }

    tooltipSection(resources: ActionCounter, now: Date, target: number | string, prepend = '') {
        // final level and time to target level
        if (resources.ms > 0) {
            return this.wrapTimeLeft(
                prepend + this.timeLeftToHTML(
                    resources,
                    target,
                    this.msToHms(resources.ms),
                    this.dateFormat(now, this.addMSToDate(now, resources.ms)),
                ),
            );
        } else if (prepend !== '') {
            return this.wrapTimeLeft(
                prepend,
            );
        }
        return '';
    }

    finalLevelElement(finalName: string, finalTarget: string, label: string) {
        return ''
            + '<div class="row no-gutters">'
            + '  <div class="col-6" style="white-space: nowrap;">'
            + '    <h3 class="font-size-base m-1" style="color:white;" >'
            + `      <span class="p-1" style="text-align:center; display: inline-block;line-height: normal;color:white;">`
            + finalName
            + '      </span>'
            + '    </h3>'
            + '  </div>'
            + '  <div class="col-6" style="white-space: nowrap;">'
            + '    <h3 class="font-size-base m-1" style="color:white;" >'
            + `      <span class="p-1 bg-${label} rounded" style="text-align:center; display: inline-block;line-height: normal;width: 100px;color:white;">`
            + finalTarget
            + '      </span>'
            + '    </h3>'
            + '  </div>'
            + '</div>';
    }

    timeLeftToHTML(resources: ActionCounter, target: number | string, time: string, finish: string) {
        return `Time to ${target}: ${time}<br>ETA: ${finish}`;
    }

    wrapTimeLeft(s: string) {
        return ''
            + '<div class="row no-gutters">'
            + '	<span class="col-12 m-1" style="padding:0.5rem 1.25rem;min-height:2.5rem;font-size:0.875rem;line-height:1.25rem;text-align:center">'
            + s
            + '	</span>'
            + '</div>';
    }

    formatLevel(level: number, progress: number) {
        if (!this.settings.get('SHOW_PARTIAL_LEVELS')) {
            return level;
        }
        progress = Math.floor(progress);
        if (progress !== 0) {
            return (level + progress / 100).toFixed(2);
        }
        return level;
    }

    // Convert milliseconds to hours/minutes/seconds and format them
    msToHms(ms: number, isShortClock = this.settings.get('IS_SHORT_CLOCK')) {
        let seconds = Number(ms / 1000);
        // split seconds in days, hours, minutes and seconds
        let d = Math.floor(seconds / 86400)
        let h = Math.floor(seconds % 86400 / 3600);
        let m = Math.floor(seconds % 3600 / 60);
        let s = Math.floor(seconds % 60);
        // no comma in short form
        // ` and ` if hours and minutes or hours and seconds
        // `, ` if hours and minutes and seconds
        let dDisplayComma = " ";
        if (!isShortClock && d > 0) {
            let count = 0;
            if (h > 0) {
                count++;
            }
            if (m > 0) {
                count++;
            }
            if (s > 0) {
                count++;
            }
            if (count === 1) {
                dDisplayComma = " and ";
            } else if (count > 1) {
                dDisplayComma = ", ";
            }
        }
        let hDisplayComma = " ";
        if (!isShortClock && h > 0) {
            let count = 0;
            if (m > 0) {
                count++;
            }
            if (s > 0) {
                count++;
            }
            if (count === 1) {
                hDisplayComma = " and ";
            } else if (count > 1) {
                hDisplayComma = ", ";
            }
        }
        // no comma in short form
        // ` and ` if minutes and seconds
        let mDisplayComma = " ";
        if (!isShortClock && m > 0) {
            if (s > 0) {
                mDisplayComma = " and ";
            }
        }
        // append h/hour/hours etc depending on isShortClock, then concat and return
        return this.appendName(d, "day", isShortClock) + dDisplayComma
            + this.appendName(h, "hour", isShortClock) + hDisplayComma
            + this.appendName(m, "minute", isShortClock) + mDisplayComma
            + this.appendName(s, "second", isShortClock);
    }

    // help function for time display
    appendName(t: number, name: string, isShortClock: boolean) {
        if (t === 0) {
            return "";
        }
        if (isShortClock) {
            return t + name[0];
        }
        let result = t + " " + name;
        if (t === 1) {
            return result;
        }
        return result + "s";
    }

    private displayContainer(id: string) {
        const displayContainer = document.createElement('div');
        displayContainer.classList.add('font-size-base');
        displayContainer.classList.add('font-w600');
        displayContainer.classList.add('text-center');
        displayContainer.classList.add('text-muted');
        const display = document.createElement('small');
        display.id = id;
        display.classList.add('mb-2');
        display.style.display = 'block';
        display.style.clear = 'both'
        display.style.whiteSpace = 'pre-line';
        // @ts-ignore
        display.dataToggle = 'tooltip';
        // @ts-ignore
        display.dataPlacement = 'top';
        // @ts-ignore
        display.dataHtml = 'true';
        display.title = '';
        // @ts-ignore
        display.dataOriginalTitle = '';
        displayContainer.appendChild(display);
        const displayAmt = document.createElement('small');
        displayAmt.id = `${id + '-YouHave'}`;
        display.classList.add('mb-2');
        display.style.display = 'block';
        display.style.clear = 'both'
        display.style.whiteSpace = 'pre-line';
        displayContainer.appendChild(displayAmt);
        return displayContainer;
    }
}