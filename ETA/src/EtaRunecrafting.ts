import type {Runecrafting} from "../../Game-Files/gameTypes/runecrafting";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {EquipmentItem, Item} from "../../Game-Files/gameTypes/item";

export class EtaRunecrafting extends ResourceSkillWithMastery {
    constructor(game: Game, runecrafting: Runecrafting, action: any, settings: Settings) {
        super(game, runecrafting, action, settings);
    }
/*
    get masteryModifiedInterval() {
        return 1700;
    }

    actionXP() {
        let xp = super.actionXP();
        // Tier 2 Mastery Pool Checkpoint: 250% base xp when making runes
        if (this.skill.isMakingRunes && this.isPoolTierActive(1)) {
            xp *= 2.5;
        }
        return xp;
    }

    modifyItemCost(item: Item, quantity: number) {
        // @ts-ignore
        if (this.action.product instanceof EquipmentItem && item.type === 'Rune') {
            const masteryLevel = this.masteryLevel;
            let runeCostReduction = Math.floor(masteryLevel / 10) * 0.05;
            if (checkMasteryMilestone(99)) {
                runeCostReduction += 0.15;
            }
            quantity = Math.floor(quantity * (1 - runeCostReduction));
        }
        return Math.max(1, quantity);
    }

    getPreservationChance(chance: number) {
        if (this.isPoolTierActive(2)) {
            chance += 10;
        }
        if (this.action.product.type === 'Magic Staff') {
            chance += this.modifiers.increasedRunecraftingStavePreservation;
        } else if (this.action.category.id === "melvorF:StandardRunes"
            || this.action.category.id === "melvorF:CombinationRunes") {
            chance += this.modifiers.increasedRunecraftingEssencePreservation;
        }
        return super.getPreservationChance(chance);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0))
            modifier += 5;
        return modifier;
    }

 */
}