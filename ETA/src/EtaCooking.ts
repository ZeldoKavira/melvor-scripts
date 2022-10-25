import {Cooking} from "../../Game-Files/built/cooking";
import {Settings} from "./Settings";
import {ResourceSkill} from "./ResourceSkill";
import {Game} from "../../Game-Files/built/game";

export class EtaCooking extends ResourceSkill {
    constructor(game: Game, cooking: Cooking, action: any, settings: Settings) {
        super(game, cooking, action, settings);
    }

    get actionInterval() {
        return this.modifyInterval(this.action.baseInterval);
    }

    get masteryModifiedInterval() {
        return this.action.baseInterval * 0.85;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }

    getRecipeSuccessChance() {
        const masteryLevel = this.masteryLevel;
        let chance = Cooking.baseSuccessChance;
        chance += this.modifiers.increasedChanceSuccessfulCook
            - this.modifiers.decreasedChanceSuccessfulCook;
        chance += masteryLevel * 0.6;
        let chanceCap = 100;
        // Pig + Mole Synergy: Cap success rate at 75%
        chanceCap -= this.modifiers.decreasedCookingSuccessCap;
        chance = Math.min(chance, chanceCap);
        if (chance < 0) {
            return 0;
        }
        return chance;
    }

    modifyXP(amount: number) {
        // full xp for successful actions, no xp for failed actions
        return super.modifyXP(amount * this.getRecipeSuccessChance() / 100);
    }

    getPreservationChance(chance: number) {
        if (this.isPoolTierActive(2)) {
            chance += 10;
        }
        return super.getPreservationChance(chance);
    }
}