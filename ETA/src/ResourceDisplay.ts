import {Display} from "./Display";
import {ResourceActionCounter} from "./ActionCounter";
import {ResourceSkill} from "./ResourceSkill";

export class ResourceDisplay extends Display {

    injectHTML(result: ResourceSkill, now: Date) {
        if (this.element === null) {
            return undefined;
        }
        this.element.style.display = 'block';

        ////////////////
        // rates part //
        ////////////////

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

        ///////////////////
        // resource part //
        ///////////////////
        const resourceActionsTaken = result.actionsTaken.resources;
        if (resourceActionsTaken.actions === 0) {
            this.element.textContent += "\r\nNo resources!";
        } else {
            this.element.textContent += "\r\nActions: " + this.formatNumber(resourceActionsTaken.actions)
                + "\r\nTime: " + this.msToHms(resourceActionsTaken.ms)
                + "\r\nETA: " + this.dateFormat(now, this.addMSToDate(now, resourceActionsTaken.ms));
        }

        //////////////////
        // product part //
        //////////////////
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

    tooltipSection(resources: ResourceActionCounter, now: Date, target: number | string, prepend = '') {
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

    timeLeftToHTML(resources: ResourceActionCounter, target: number | string, time: string, finish: string) {
        return `Time to ${target}: ${time}<br>ETA: ${finish}` + this.resourcesLeftToHTML(resources);
    }

    resourcesLeftToHTML(resources: ResourceActionCounter) {
        if (this.settings.get('HIDE_REQUIRED')) {
            return '';
        }
        let req = '';
        resources.items.forEach(used => {
                const item = this.items.getObjectByID(used.item);
                if (item === undefined) {
                    return;
                }
                req += `<span>${this.formatNumber(Math.ceil(used.quantity))}</span><img class="skill-icon-xs mr-2" src="${item.media}">`;
            }
        )
        if (resources.sc > 0) {
            req += `<span>${this.formatNumber(Math.ceil(resources.sc))}</span><img class="skill-icon-xs mr-2" src="assets/media/main/slayer_coins.svg">`;
        }
        if (resources.gp > 0) {
            req += `<span>${this.formatNumber(Math.ceil(resources.gp))}</span><img class="skill-icon-xs mr-2" src="assets/media/main/coins.svg">`;
        }
        return `<br/>Requires: ${req}`;
    }
}