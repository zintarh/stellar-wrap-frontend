import fs from "fs";
import path from "path";
import {
  ENV_VARS,
  CONTRACT_ADDRESS_VARS,
  parseEnvExample,
  checkBuildEnv,
} from "../scripts/validate-env.js";

const VALID_ADDRESS = "C" + "B".repeat(55);

describe("scripts/validate-env.js", () => {
  it("covers exactly the variables declared in .env.example", () => {
    const envExample = fs.readFileSync(path.join(__dirname, "../.env.example"), "utf8");
    const documented = parseEnvExample(envExample).sort();
    const validated = ENV_VARS.map((v: { name: string }) => v.name).sort();

    expect(validated).toEqual(documented);
  });

  it("fails a build without a contract address, naming the variables", () => {
    const { errors } = checkBuildEnv({ CRON_SECRET: "secret" });

    expect(errors).toHaveLength(1);
    CONTRACT_ADDRESS_VARS.forEach((name: string) => expect(errors[0]).toContain(name));
  });

  it("fails a build with a malformed contract address", () => {
    const { errors } = checkBuildEnv({
      NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET: "CBAD",
      CRON_SECRET: "secret",
    });

    expect(errors).toEqual([expect.stringContaining("NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET")]);
  });

  it("only warns about a missing runtime variable", () => {
    const { errors, warnings } = checkBuildEnv({
      NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET: VALID_ADDRESS,
    });

    expect(errors).toEqual([]);
    expect(warnings).toEqual([expect.stringContaining("CRON_SECRET")]);
  });

  it("passes when every required variable is set", () => {
    expect(
      checkBuildEnv({ NEXT_PUBLIC_CONTRACT_ADDRESS: VALID_ADDRESS, CRON_SECRET: "secret" })
    ).toEqual({ errors: [], warnings: [] });
  });
});
