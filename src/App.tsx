import React, { useEffect, useReducer } from 'react';
import logo from './logo.svg';
import './App.css';

import { makeObservable, runInAction, observable, reaction } from 'mobx'

import CoinApi from './CoinApi';

class Query<DataType, ErrorType = Error, ParamsType = any> {
  callback: (params?: ParamsType) => Promise<DataType>;

  @observable isLoading = false;
  @observable data?: DataType;
  @observable error?: ErrorType;

  private pendingPromise?: Promise<DataType>;

  constructor(callback: () => Promise<DataType>) {
    this.callback = callback;
    makeObservable(this);
  }

  run(params = {} as ParamsType): Promise<DataType> {
    if (this.pendingPromise) return this.pendingPromise;

    const execute = async () => {
      let data = null as unknown as DataType; // due to strictNullCheck
      let error: ErrorType;

      try {
        data = await this.callback(params);
      } catch (e) {
        error = e as ErrorType;
      }

      runInAction(() => {
        this.isLoading = false;
        this.data = data
        this.error = error;
      });

      return data;
    }

    this.pendingPromise = execute().finally(() => {
      delete this.pendingPromise;
    });

    return this.pendingPromise;
  }
}


class QueryClient {
  queryStore = new Map<string, Query<unknown>>();

  getQuery<T>(key: string, callback: () => Promise<T>): Query<T> {
    if (this.queryStore.has(key)) return this.queryStore.get(key) as Query<T>;

    const query: Query<T> = new Query(callback);
    this.queryStore.set(key, query);
    return query;
  }

  setQueryData<T = any>(key: string, data: T) {
    const query = this.getQuery(key, async () => data);
    query.run();
  }
}

const queryClient = new QueryClient();


const useQuery = <T extends unknown>(key: string, callback: () => Promise<T>) => {
  // https://reactjs.org/docs/hooks-faq.html#is-there-something-like-forceupdate
  const forceUpdate = useReducer(() => ({}), {})[1];
  const query = queryClient.getQuery(key, callback);

  useEffect(() => {
    query.run();

    const dispose = reaction(
      () => [query.isLoading, query.data, query.error], // subscribe on these fields
      () => forceUpdate() // run whenever any of above changed
    );

    return dispose; // stop observing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, query]);

  return { isLoading: query.isLoading, data: query.data, error: query.error };
}


const DummyComponent = () => {
  const { isLoading, data } = useQuery('coins', CoinApi.getCoins);

  // check data presence in order to satisfy typescript...
  if (isLoading || !data) return <i>Loading...</i>;

  return (
    <table>
      <tbody>
        <tr>
          <th>Coin</th>
          <th>Price</th>
        </tr>
        <tr>
          <td>USD</td>
          <td>{data.bpi.USD.rate}</td>
        </tr>
        <tr>
          <td>EUR</td>
          <td>{data.bpi.EUR.rate}</td>
        </tr>
      </tbody>
    </table>
  )
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <DummyComponent />
        <DummyComponent />
        <DummyComponent />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
