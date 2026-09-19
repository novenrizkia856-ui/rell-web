/* Rights category detail dialog (reference: card detail dialog).
   Each check lists the source it usually comes from, using the
   three verification states. */
(function (RELL) {
  "use strict";

  var STATE_LABEL = {
    onchain: "Onchain",
    issuer: "Issuer",
    reported: "Reported"
  };

  var RIGHTS = {
    ownership: {
      index: "01",
      title: "Ownership",
      question: "Do you hold the asset, or a claim on it?",
      checks: [
        ["Legal title to the share", "issuer"],
        ["Custody model", "issuer"],
        ["Supply matched to backing", "onchain"]
      ]
    },
    economic: {
      index: "02",
      title: "Economic Claims",
      question: "Do you get price exposure and dividends?",
      checks: [
        ["Price exposure", "issuer"],
        ["Dividend handling", "issuer"],
        ["Payout history", "onchain"]
      ]
    },
    control: {
      index: "03",
      title: "Control Rights",
      question: "Can you vote or shape decisions?",
      checks: [
        ["Shareholder voting", "issuer"],
        ["Proxy access", "reported"],
        ["Admin roles on the contract", "onchain"]
      ]
    },
    transfer: {
      index: "04",
      title: "Transfer Rights",
      question: "Where, and to whom, can it move?",
      checks: [
        ["Wallet allowlist", "onchain"],
        ["Region limits", "issuer"],
        ["Freeze powers", "onchain"]
      ]
    },
    defi: {
      index: "05",
      title: "DeFi Compatibility",
      question: "Will onchain protocols accept it?",
      checks: [
        ["Token standard", "onchain"],
        ["Transfer hooks", "onchain"],
        ["Protocol support", "reported"]
      ]
    },
    status: {
      index: "06",
      title: "Asset Status",
      question: "Is it active, paused, or winding down?",
      checks: [
        ["Pause state", "onchain"],
        ["Corporate actions", "issuer"],
        ["Redemption path", "reported"]
      ]
    }
  };

  RELL.initRightsDialog = function () {
    var dialog = document.querySelector("[data-right-dialog]");
    if (!dialog || typeof dialog.showModal !== "function") return;

    var indexEl = dialog.querySelector("[data-dialog-index]");
    var titleEl = dialog.querySelector("[data-dialog-title]");
    var questionEl = dialog.querySelector("[data-dialog-question]");
    var list = dialog.querySelector("[data-dialog-checks]");
    var opener = null;

    function fill(right) {
      indexEl.textContent = "Right " + right.index;
      titleEl.textContent = right.title;
      questionEl.textContent = right.question;
      list.textContent = "";
      right.checks.forEach(function (check) {
        var li = document.createElement("li");
        var name = document.createElement("span");
        name.textContent = check[0];
        var badge = document.createElement("span");
        badge.className = "state-badge state-badge--sm state-badge--" + check[1];
        var dot = document.createElement("span");
        dot.className = "state-badge__dot";
        badge.appendChild(dot);
        badge.appendChild(document.createTextNode(STATE_LABEL[check[1]]));
        li.appendChild(name);
        li.appendChild(badge);
        list.appendChild(li);
      });
    }

    // Delegated so clones created by the marquee also open the dialog.
    document.addEventListener("click", function (event) {
      var card = event.target.closest("[data-right]");
      if (!card) return;
      var right = RIGHTS[card.getAttribute("data-right")];
      if (!right) return;
      opener = card;
      fill(right);
      dialog.showModal();
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.closest("[data-dialog-close]")) {
        dialog.close();
      }
    });

    // Native Escape handling can be suppressed by browser close watchers.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && dialog.open) {
        event.preventDefault();
        dialog.close();
      }
    });

    dialog.addEventListener("close", function () {
      if (opener && opener.getAttribute("tabindex") !== "-1") {
        opener.focus({ preventScroll: true });
      }
    });
  };
})(window.RELL = window.RELL || {});
