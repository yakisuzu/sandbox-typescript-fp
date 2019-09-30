import fetch, {BodyInit, RequestInit} from "node-fetch";
import * as querystring from "querystring";

interface GitHubRepo {
  name: string,
}

interface GitHubPull {
  url: string,
  title: string,
  user: {login: string},
  assignee: {login: string},
  head: {label: string},
  base: {label: string},
}

interface ShowPull {
  url: string,
  title: string,
  user: string,
  branch: string,
}

class GitHubRepository {
  constructor(
    readonly auth: string,
  ) {
  }

  createHeaders(usePostParam: boolean): object {
    return {
      "Authorization": `Basic ${this.auth}`,
      "Content-Type": usePostParam ? "application/json" : undefined,
    };
  }

  async fetch<E>(
    method: string,
    baseUrl: string,
    baseParam: object = {},
  ): Promise<E> {
    // methodで渡し方かわるのめんどくさい
    const usePostParam = ["PUT", "POST"].includes(method);
    const bodyParam: BodyInit | undefined = usePostParam ? baseParam as BodyInit : undefined;
    const url: string = usePostParam
      ? baseUrl
      : baseUrl + "?" + querystring.stringify(baseParam as querystring.ParsedUrlQueryInput);

    return await fetch(url, {
      method,
      headers: this.createHeaders(usePostParam),
      body: bodyParam,
    } as RequestInit).then(r => r.json());
  }

  async getRecursive<E>(
    baseUrl: string,
    baseParam: object = {},
    page: number = 1, // 現在のページ
    per_page: number = 100, // 取得件数（デフォルト30, 最大100）
    beforeResult: E[] = [],
  ): Promise<E[]> {
    const url: string = baseUrl + "?" + querystring.stringify({
      ...baseParam,
      page,
      per_page,
    });

    const currentResult: E[] = await fetch(url, {
      method: "GET",
      headers: this.createHeaders(false),
    } as RequestInit).then(async r => {
      if (r.status !== 200) {
        console.error({url: r.url, status: r.status, text: await r.text()});
        return [];
      }
      console.debug({url: r.url, status: r.status});
      return r.json();
    });
    const totalResult = beforeResult.concat(currentResult);
    return currentResult.length === per_page
      // 最大件数まで取得したので、もう一度
      ? this.getRecursive(baseUrl, baseParam, page + 1, per_page, totalResult)
      // 最大件数と取得件数が合わなければ終わり
      : totalResult;
  }

  async getOrgRepos(org: string): Promise<GitHubRepo[]> {
    return this.getRecursive(`https://api.github.com/orgs/${org}/repos`);
  }

  async getOwnerRepoPulls(owner: string, repo: string): Promise<GitHubPull[]> {
    return this.getRecursive(`https://api.github.com/repos/${owner}/${repo}/pulls`);
  }
}

function chunk<E>(v: E[], parallel: number): E[][] {
  const chunked = v.reduce((pv, cv, ci) => {
    const chunkKey = ci % parallel;
    return {
      ...pv,
      [chunkKey]: (pv[chunkKey] || []).concat([cv]),
    };
  }, {});
  return Object.keys(chunked).map(key => chunked[key]);
}

function mapSync<E, T>(base: T[], f: (currentValue: T) => Promise<E[]>): Promise<E[]> {
  return base.reduce(async (previousValue: Promise<E[]>, currentValue: T) =>
      // 前のasyncをawaitしてから、次のasyncをawaitすることで直列になる
      (await previousValue).concat(await f(currentValue))
    , Promise.resolve([]));
}


(async () => {
  // encode
  // new Buffer('a').toString('base64') // => YQ==
  // decode
  // new Buffer("YQ==",'base64').toString() // => a
  const auth: string = process.env["GITHUB_AUTH"] || ""; // "userId:password" のbase64
  const owner: string = process.env["GITHUB_OWNER"] || "";
  const repository = new GitHubRepository(auth);
  console.log({auth: auth ? "あり" : "", owner});

  // 再帰で全件とる
  const rRepos: GitHubRepo[] = await repository.getOrgRepos(owner).catch(() => []);
  const repoNames: string[] = rRepos.map(r => r.name);
  console.log({repoNames});

  // ふつうの直列
  // const rPulls: GitHubPull[] = await mapSync(repoNames, cv =>
  //   repository.getOwnerRepoPulls(owner, cv).catch(() => []),
  // );

  // 並列+直列にしたい
  const chunkedRepoNames: string[][] = chunk(repoNames, 3);
  console.log({chunkedRepoNames});

  // Promise[]つくって、Promise.allでまちあわせ
  const readyPromise: Promise<GitHubPull[]>[] = chunkedRepoNames.map(async repoNames => mapSync(repoNames, cv =>
    repository.getOwnerRepoPulls(owner, cv).catch(() => []),
  ));
  const rPulls: GitHubPull[] = (await Promise.all(readyPromise)).flat();

  const pulls: ShowPull[] = rPulls.map(p => ({
    url: p.url,
    title: p.title,
    user: p.user.login,
    branch: `${p.head.label} to ${p.base.label}`,
  }));

  console.log({pulls});
})();

