
type Coins = {
  bpi: {
    EUR: {
      code: string;
      description: string;
      rate: string;
      rate_float: number;
      symbol: string;
    },
    USD: {
      code: string;
      description: string;
      rate: string;
      rate_float: number;
      symbol: string;
    }
  }
}

const CoinApi = {
  getCoins: async (): Promise<Coins> => {
    const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
    return response.json();
  }
};

export default CoinApi;
