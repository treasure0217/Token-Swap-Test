// src/config/config.service.ts
import { config } from 'dotenv';

config();

class ConfigService {
  constructor(private env: { [k: string]: string | undefined }) {}

  private getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }

    return value;
  }

  public ensureValues(keys: string[]) {
    keys.forEach((k) => this.getValue(k, true));
    return this;
  }

  public getPort() {
    return this.getValue('PORT', true);
  }

  public getRpcUrl() {
    return this.getValue('RPC_URL', true);
  }

  public getContractAddress() {
    return this.getValue('CONTRACT_ADDRESS', true);
  }

  public getStartBlockNumber() {
    return +this.getValue('START_BLOCK', true);
  }
}

const configService = new ConfigService(process.env);

export { configService, ConfigService };
