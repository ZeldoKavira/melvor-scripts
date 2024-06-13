import type {Cooking} from "../../Game-Files/gameTypes/cooking";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";

export class EtaCooking extends ResourceSkillWithMastery {
    constructor(game: Game, cooking: Cooking, action: any, settings: Settings) {
        super(game, cooking, action, settings);
    }

    get actionInterval() {
        return this.modifyInterval(this.action.baseInterval);
    }

    get successRate() {
        return this.recipeSuccessChance;
    }

    get masteryModifiedInterval() {
        return this.action.baseInterval * 0.85;
    }

    get recipeSuccessChance() {
        const masteryLevel = this.masteryLevel;
        // @ts-ignore
        let chance = Cooking.baseSuccessChance;
        chance += this.modifiers.getValue("melvorD:successfulCookChance" /* ModifierIDs.successfulCookChance */, this.getActionModifierQuery());
        let chanceCap = 100;
        // Pig + Mole Synergy: Cap success rate at 75%
        chanceCap += this.modifiers.cookingSuccessCap;
        chance = Math.min(chance, chanceCap);
        if (chance < 0) {
            return 0;
        }
        return chance / 100;
    }

    skip() {
        const category = this.action.category;
        return this.action !== this.skill.selectedRecipes.get(category);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }

    modifyMelvorXP(amount: number) {
        // TODO: check if this works properly
        //  full xp for successful actions, no xp for failed actions
        return super.modifyMelvorXP(amount);
    }

    getPreservationChance(chance: number) {
        if (this.isPoolTierActive(2)) {
            chance += 10;
        }
        return super.getPreservationChance(chance);
    }
}