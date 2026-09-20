/* Wallet connect.
   Reown AppKit is pulled from a CDN, so it is loaded on demand rather than on
   every page load. The landing page is read only and most visitors never
   connect, so paying 300KB up front for all of them is not worth it.

   Load points:
     first click            the usual path, the button shows a pending state
     idle, only if the      so a returning visitor sees their address without
     visitor connected      having to click again
     here before

   Everything is wrapped so a blocked or failed CDN leaves the rest of the page
   working. The project id is a public client identifier, not a secret, but it
   is origin restricted in Reown Cloud. */
const APPKIT = "https://cdn.jsdelivr.net/npm/@reown/appkit@1/+esm";
const ETHERS_ADAPTER = "https://cdn.jsdelivr.net/npm/@reown/appkit-adapter-ethers@1/+esm";
const SEEN_KEY = "rell.wallet.seen";

const buttons = Array.from(document.querySelectorAll("[data-wallet-connect]"));
if (buttons.length) {
  init().catch(function () {
    /* never let wallet setup break the page */
  });
}

async function init() {
  const config = await window.RELL.loadConfig();
  const projectId = config.walletConnect && config.walletConnect.projectId;

  // No project id configured means no wallet button at all, rather than a
  // button that can only fail.
  if (!projectId) {
    buttons.forEach(function (b) {
      b.hidden = true;
    });
    return;
  }

  const network = {
    id: Number(config.network.chainId) || 4663,
    chainNamespace: "eip155",
    caipNetworkId: "eip155:" + (Number(config.network.chainId) || 4663),
    name: config.network.name || "Robinhood Chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
    blockExplorers: config.network.explorerUrl
      ? { default: { name: "Blockscout", url: config.network.explorerUrl } }
      : undefined
  };

  let kit = null;
  let loading = null;

  function setState(state, label) {
    buttons.forEach(function (b) {
      b.dataset.state = state;
      const text = b.querySelector("[data-wallet-label]");
      if (text) text.textContent = label;
      b.setAttribute("aria-label", state === "connected" ? "Wallet menu, " + label : label);
      b.disabled = state === "pending";
    });
  }

  function short(address) {
    return address.slice(0, 6) + "…" + address.slice(-4);
  }

  function apply(account) {
    if (account && account.isConnected && account.address) {
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch (e) {
        /* private mode */
      }
      setState("connected", short(account.address));
    } else {
      setState("idle", "Connect Wallet");
    }
  }

  function load() {
    if (loading) return loading;
    loading = (async function () {
      const [{ createAppKit }, { EthersAdapter }] = await Promise.all([
        import(APPKIT),
        import(ETHERS_ADAPTER)
      ]);
      kit = createAppKit({
        adapters: [new EthersAdapter()],
        networks: [network],
        defaultNetwork: network,
        projectId: projectId,
        allowUnsupportedChain: true,
        features: { analytics: false, email: false, socials: false, swaps: false, onramp: false },
        themeMode: "light",
        themeVariables: {
          "--w3m-accent": "#0946f7",
          "--w3m-color-mix": "#0b0e17",
          "--w3m-color-mix-strength": 8,
          "--w3m-border-radius-master": "3px",
          "--w3m-font-family": "Geist, Inter, sans-serif"
        },
        metadata: {
          name: "RELL",
          description: "Rights intelligence for tokenized assets",
          url: window.location.origin,
          icons: [window.location.origin + "/assets/brand/apple-touch-icon.png"]
        }
      });
      kit.subscribeAccount(apply);
      return kit;
    })();
    return loading;
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", async function () {
      const connected = button.dataset.state === "connected";
      if (!kit) setState("pending", "Connecting");
      try {
        const instance = await load();
        await instance.open(connected ? { view: "Account" } : undefined);
        if (!connected) apply(null);
      } catch (e) {
        setState("idle", "Connect Wallet");
        if (window.RELL && window.RELL.toast) window.RELL.toast("Wallet connect is unavailable");
      }
    });
  });

  // A returning visitor who connected before gets their session restored without
  // a click. Everyone else pays nothing.
  let seen = false;
  try {
    seen = localStorage.getItem(SEEN_KEY) === "1";
  } catch (e) {
    /* private mode */
  }
  if (seen) {
    const idle = window.requestIdleCallback || function (fn) {
      return setTimeout(fn, 1200);
    };
    idle(function () {
      load().catch(function () {});
    });
  }
}
