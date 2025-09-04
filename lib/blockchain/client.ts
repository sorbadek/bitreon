import { AppConfig, UserSession } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';

export const appConfig = new AppConfig(['store_write', 'publish_data']);

export const userSession = new UserSession({ appConfig });

export const network = STACKS_TESTNET;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export const STX_DECIMALS = 6;

export const microToStx = (amount: number | string) => {
  const value = typeof amount === 'string' ? parseInt(amount) : amount;
  return value / Math.pow(10, STX_DECIMALS);
};

export const stxToMicro = (amount: number) => {
  return Math.floor(amount * Math.pow(10, STX_DECIMALS));
};
