/** BUGS=<id,id|all> switches planted bugs on for a run (used by the catch matrix). */
import { parseBugList, setActiveBugs } from '../../src/lib/bugs';

setActiveBugs(parseBugList(process.env.BUGS));
