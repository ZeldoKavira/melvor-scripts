import {Firemaking} from "../../Game-Files/built/firemakingTicks";
import {Settings} from "./Settings";
import {ResourceSkill} from "./ResourceSkill";
import {Game} from "../../Game-Files/built/game";
import {Costs} from "../../Game-Files/built/skill";

export class EtaFiremaking extends ResourceSkill {
    constructor(game: Game, firemaking: Firemaking, action: any, settings: Settings) {
        super(game, firemaking, action, settings);
    }

    get masteryModifiedInterval() {
        return this.action.baseInterval * 0.6;
    }

    get actionXP() {
        return this.action.baseExperience * (1 + this.skill.bonfireBonusXP / 100);
    }

    get actionInterval() {
        return this.modifyInterval(this.action.baseInterval);
    }

    getRecipeCosts() {
        const costs = new Costs(undefined);
        costs.addItem(this.action.log, 1);
        return costs;
    }

    getPercentageIntervalModifier() {
        let modifier = super.getPercentageIntervalModifier();
        if (this.isPoolTierActive(1)) {
            modifier -= 10;
        }
        modifier -= this.masteryLevel * 0.1;
        return modifier;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        if (this.isPoolTierActive(3) && !this.skill.isPoolTierActive(3)) {
            // see Firemaking.computeProvidedStats
            modifier += 5;
        }
        if (this.masteryLevel >= 99 && this.skill.getMasteryLevel(this.action) < 99) {
            // see Firemaking.computeProvidedStats
            modifier += 0.25;
        }
        return modifier;
    }

    getXPModifier() {
        let modifier = super.getXPModifier();
        if (this.skill.isBearDevilActive) {
            modifier += 5;
        }
        return modifier;
    }
}