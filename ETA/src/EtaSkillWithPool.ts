import {RatesWithPool} from "./RatesWithPool";
import {TargetsWithPool} from "./TargetsWithPool";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";
import {EtaSkill} from "./EtaSkill";

export class EtaSkillWithPool extends EtaSkill {
    // trackers
    public poolXp: number;
    // initial and target
    public initial: RatesWithPool;
    public targets: TargetsWithPool;
    // current rates
    public currentRates: RatesWithPool;
    // targets reached
    public poolReached: boolean;
    protected readonly masteryCheckpoints: number[];

    constructor(...[game, skill, action, settings]: [Game, any, any, Settings]) {
        const args: [Game, any, any, Settings] = [game, skill, action, settings];
        super(...args);
        this.targets = new TargetsWithPool(this, settings, skill, action);
        this.poolXp = 0;
        this.currentRates = RatesWithPool.emptyRates;
        this.initial = RatesWithPool.emptyRates;
        // @ts-ignore
        this.masteryCheckpoints = [...masteryCheckpoints, Infinity];
        // flag to check if target was already reached
        this.poolReached = false;
    }

    /***
     * Get and set rates
     */

    get gainsPerAction() {
        return RatesWithPool.addPoolToRates(
            super.gainsPerAction,
            0,
        );
    }

    get averageRates(): RatesWithPool {
        return RatesWithPool.addPoolToRates(
            super.averageRates,
            (this.poolXp - this.initial.pool) / this.actionsTaken.active.ms,
        );
    }

    /***
     * pool methods
     */

    get poolProgress() {
        return this.poolXpToPercentWithModifiers(this.poolXp);
    }

    get nextPoolCheckpoint() {
        const poolProgress = this.poolProgress;
        const checkPoint = this.masteryCheckpoints.find((checkPoint: number) => checkPoint > poolProgress) ?? Infinity;
        if (poolProgress < this.targets.poolPercent && poolProgress < checkPoint) {
            return this.targets.poolPercent;
        }
        return checkPoint;
    }

    get nextPoolCheckpointXp() {
        return this.nextPoolCheckpoint / 100 * this.skill.baseMasteryPoolCap;
    }

    /***
     * Interval methods
     */

    get poolCompleted() {
        return !this.poolReached && this.targets.poolCompleted();
    }

    getTargets(settings: Settings) {
        return new TargetsWithPool(this, settings, this.skill, this.action);
    }

    init(game: Game) {
        super.init(game);
        // get initial values
        // current pool xp
        this.poolXp = this.skill.masteryPoolXP;
        // initial
        this.initial = RatesWithPool.addPoolToRates(
            this.initial,
            this.poolXp,
        );
        // flag to check if target was already reached
        this.poolReached = false;
    }

    setFinalValues() {
        super.setFinalValues();
        if (this.poolCompleted) {
            this.actionsTaken.pool = this.actionsTaken.active.clone();
            this.poolReached = true;
        }
    }

    actionsToCheckpoint(gainsPerAction: RatesWithPool) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        const requiredForPoolCheckPoint = this.nextPoolCheckpointXp - this.poolXp;
        const actionsToPoolCheckpoint = requiredForPoolCheckPoint / gainsPerAction.pool;
        return Math.ceil(Math.min(
            super.actionsToCheckpoint(gainsPerAction),
            actionsToPoolCheckpoint,
        ));
    }

    addActions(gainsPerAction: RatesWithPool, actions: number) {
        super.addActions(gainsPerAction, actions);
        this.poolXp += gainsPerAction.pool * actions;
    }

    setCurrentRatesNoCheck(gains: RatesWithPool): RatesWithPool {
        return this.currentRates = RatesWithPool.addPoolToRates(
            super.setCurrentRatesNoCheck(gains),
            gains.pool / gains.ms,
        );
    }

    /***
     * Pool methods
     */

    poolPerAction(masteryXp: number) {
        if (this.skillLevel >= 99) {
            return masteryXp / 2;
        }
        return masteryXp / 4;
    }

    isPoolTierActive(tier: number) {
        return this.poolProgress >= this.masteryCheckpoints[tier];
    }

    poolXpToPercent(poolXp: number) {
        return (100 * poolXp) / this.skill.baseMasteryPoolCap;
    }

    poolXpToPercentWithModifiers(poolXp: number) {
        return this.poolXpToPercent(poolXp) + this.modifiers.increasedMasteryPoolProgress;
    }

    getXpMap() {
        const levels = super.getXpMap();
        levels.set('poolXp', this.poolXp);
        return levels;
    }
}