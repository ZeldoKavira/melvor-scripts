import type {Summoning} from "../../Game-Files/gameTypes/summoning";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Item} from "../../Game-Files/gameTypes/item";
import type {Player} from "../../Game-Files/gameTypes/player";
import type {Costs} from "../../Game-Files/gameTypes/skill";

export class EtaSummoning extends ResourceSkillWithMastery {
    private readonly player: Player;

    constructor(game: Game, summoning: Summoning, action: any, settings: Settings) {
        super(game, summoning, action, settings);
        this.player = game.combat.player;
    }

    get masteryModifiedInterval() {
        return 4850;
    }

    getNonShardCostReductionModifier() {
        if (this.action.id === "melvorF:Salamander" && this.modifiers.disableSalamanderItemReduction) {
            return 100;
        }
        // Equipped summon cost reduction
        let modifier = 100;
        modifier -= this.modifiers.getValue(
            "melvorD:nonShardSummoningCostReduction" /* ModifierIDs.nonShardSummoningCostReduction */,
            this.getActionModifierQuery()
        );
        // mastery
        const masteryLevel = this.masteryLevel;
        // Non-Shard Cost reduction that scales with mastery level
        modifier -= Math.floor(masteryLevel / 10) * 5;
        // Level 99 Mastery: 5% Non Shard Cost Reduction
        if (this.checkMasteryMilestone(99)) {
            modifier -= 5;
        }
        return Math.max(0, modifier);
    }

    modifyItemCost(item: Item, quantity: number) {
        const masteryLevel = this.masteryLevel;
        if (item.type === 'Shard') {
            // Level 50 Mastery: +1 Shard Cost Reduction
            if (this.checkMasteryMilestone(50)) {
                quantity--;
            }
            // Level 99 Mastery: +1 Shard Cost Reduction
            if (this.checkMasteryMilestone(99)) {
                quantity--;
            }
            // Generic Shard Cost Decrease modifier
            quantity -= this.modifiers.getValue(
                "melvorD:flatSummoningShardCost" /* ModifierIDs.flatSummoningShardCost */,
                this.getActionModifierQuery()
            );
            // Tier 2 Mastery Pool: +1 Shard Cost Reduction for Tier 1 and Tier 2 Tablets
            if ((this.action.tier === 1 || this.action.tier === 2) && this.isPoolTierActive(1)) {
                quantity--;
            }
            // Tier 4 Mastery Pool: +1 Shard Cost Reduction for Tier 3 Tablets
            if (this.action.tier === 3 && this.isPoolTierActive(3)) {
                quantity--;
            }
        }
        return Math.max(1, quantity);
    }

    modifyGPCost() {
        let gpCost = super.modifyGPCost();
        gpCost *= 1 - this.getNonShardCostReductionModifier() / 100;
        return Math.max(1, Math.floor(gpCost));
    }

    modifySCCost() {
        let scCost = super.modifySCCost();
        scCost *= 1 - this.getNonShardCostReductionModifier() / 100;
        return Math.max(1, Math.floor(scCost));
    }

    getPreservationChance(chance: number) {
        // Tier 3 Mastery Pool: +10% Resource Preservation chance
        if (this.isPoolTierActive(2)) {
            chance += 10;
        }
        return super.getPreservationChance(chance);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }

    addNonShardCosts(altID: number, costs: Costs) {
        const item = this.action.nonShardItemCosts[altID];
        const salePrice = Math.max(20, item.sellsFor);
        // @ts-ignore
        const itemValueRequired = Summoning.recipeGPCost * (1 - this.getNonShardCostReductionModifier() / 100);
        const qtyToAdd = Math.max(1, Math.floor(itemValueRequired / salePrice));
        costs.addItem(item, qtyToAdd);
    }

    getAltRecipeCosts() {
        const altID = this.skill.setAltRecipes.get(this.action) ?? 0;
        const costs = super.getRecipeCosts();
        if (this.action.nonShardItemCosts.length > 0) {
            this.addNonShardCosts(altID, costs);
        }
        return costs;
    }

    getRecipeCosts() {
        return this.getAltRecipeCosts();
    }
}