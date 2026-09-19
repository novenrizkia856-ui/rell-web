/* The map: six rights categories as a tab list with a panel each.

   Every panel is rendered up front, so with JavaScript off all six stay
   readable stacked down the page. The script only hides the inactive ones and
   wires keyboard support. */
(function (RELL) {
  "use strict";

  var STATE_LABEL = {
    onchain: "Onchain",
    issuer: "Issuer",
    reported: "Reported"
  };

  var RIGHTS = [
    {
      id: "ownership",
      index: "01",
      title: "Ownership",
      question: "Do you hold the asset, or a claim on it?",
      checks: [
        ["Legal title to the share", "issuer"],
        ["Custody model", "issuer"],
        ["Supply matched to backing", "onchain"]
      ]
    },
    {
      id: "economic",
      index: "02",
      title: "Economic Claims",
      question: "Do you get price exposure and dividends?",
      checks: [
        ["Price exposure", "issuer"],
        ["Dividend handling", "issuer"],
        ["Payout history", "onchain"]
      ]
    },
    {
      id: "control",
      index: "03",
      title: "Control Rights",
      question: "Can you vote or shape decisions?",
      checks: [
        ["Shareholder voting", "issuer"],
        ["Proxy access", "reported"],
        ["Admin roles on the contract", "onchain"]
      ]
    },
    {
      id: "transfer",
      index: "04",
      title: "Transfer Rights",
      question: "Where, and to whom, can it move?",
      checks: [
        ["Wallet allowlist", "onchain"],
        ["Region limits", "issuer"],
        ["Freeze powers", "onchain"]
      ]
    },
    {
      id: "defi",
      index: "05",
      title: "DeFi Compatibility",
      question: "Will onchain protocols accept it?",
      checks: [
        ["Token standard", "onchain"],
        ["Transfer hooks", "onchain"],
        ["Protocol support", "reported"]
      ]
    },
    {
      id: "status",
      index: "06",
      title: "Asset Status",
      question: "Is it active, paused, or winding down?",
      checks: [
        ["Pause state", "onchain"],
        ["Corporate actions", "issuer"],
        ["Wind down plan", "reported"]
      ]
    }
  ];

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildPanel(right) {
    var panel = el("div", "explorer__panel");
    panel.id = "panel-" + right.id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "tab-" + right.id);
    panel.setAttribute("tabindex", "0");

    panel.appendChild(el("p", "label", "Right " + right.index));
    panel.appendChild(el("p", "explorer__question", right.question));

    var checks = el("div", "explorer__checks");
    var head = el("div", "explorer__checks-head");
    head.appendChild(el("span", "label", "What we check"));
    head.appendChild(el("span", "label", "Usual source"));
    checks.appendChild(head);

    right.checks.forEach(function (pair) {
      var row = el("div", "explorer__check");
      row.appendChild(el("span", null, pair[0]));
      var badge = el("span", "state state--" + pair[1]);
      badge.appendChild(el("span", "state__dot"));
      badge.lastChild.setAttribute("aria-hidden", "true");
      badge.appendChild(document.createTextNode(STATE_LABEL[pair[1]]));
      row.appendChild(badge);
      checks.appendChild(row);
    });

    panel.appendChild(checks);
    return panel;
  }

  RELL.initExplorer = function () {
    var list = document.querySelector("[data-explorer-list]");
    var panelHost = document.querySelector("[data-explorer-panels]");
    if (!list || !panelHost) return;

    var tabs = [];
    var panels = [];

    RIGHTS.forEach(function (right) {
      var tab = el("button", "explorer__item");
      tab.type = "button";
      tab.id = "tab-" + right.id;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", "panel-" + right.id);
      tab.appendChild(el("span", "explorer__num", right.index));
      tab.appendChild(el("span", "explorer__name", right.title));
      list.appendChild(tab);
      tabs.push(tab);

      var panel = buildPanel(right);
      panelHost.appendChild(panel);
      panels.push(panel);
    });

    function select(i, focus) {
      tabs.forEach(function (tab, n) {
        var on = n === i;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
        panels[n].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(i);
      });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (i + 1) % tabs.length;
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        select(next, true);
      });
    });

    select(0);
  };
})(window.RELL = window.RELL || {});
