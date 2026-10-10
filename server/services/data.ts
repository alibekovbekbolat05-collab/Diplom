import {
  generateWindow,
  SIM_SEED,
  generateScenario,
  generateBaseline,
  scenarioIds,
} from "@/server/simulator";
import { eventSchema, type SecurityEvent } from "@/server/schema";
import { readStore } from "@/server/adapters/store";
import type { Session } from "@/server/auth/session";
export function simulationEvents(
  now = Date.now(),
  scenario = "scheduled",
): SecurityEvent[] {
  const at = Math.floor(now / (30 * 60000)) * (30 * 60000) - 25 * 60000;
  const rows =
    scenario === "baseline"
      ? generateBaseline(SIM_SEED, now - 15 * 60000, now)
      : scenario === "all"
        ? scenarioIds.flatMap((id) => generateScenario(id, SIM_SEED, at))
        : scenarioIds.includes(scenario)
          ? generateScenario(scenario, SIM_SEED, at)
          : generateWindow(SIM_SEED, now - 15 * 60000, now, 5000);
  return rows.map((e) =>
    eventSchema.parse(
      Object.fromEntries(
        Object.entries({ ...e, simulation: true }).filter(
          ([k]) => k !== "sim_scenario" && k !== "sim",
        ),
      ),
    ),
  );
}
export async function selectedEvents(
  session: Session,
  source: string,
  scenario = "scheduled",
) {
  if (session.demo || source !== "ingested")
    return simulationEvents(Date.now(), scenario);
  return (await readStore()).events;
}
