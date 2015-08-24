// ==UserScript==
// @name         Duolingo: Refund Store Items
// @namespace    http://blog.alexstew.com/original/scripts/userscripts
// @description  Userscript for Duolingo that allows users to cancel store item purchases and regain spent lingots.
// @author       alexstewartja
// @match        https://www.duolingo.com/*
// @copyright    2015, Alex Stewart
// @version      1.0
// @updateURL       ?duo
// @downloadURL     ?duo
// ==/UserScript==

console.debug('Duolingo: Refund Store Items http://blog.alexstew.com/original/scripts/userscripts');

var main = initRefundStoreItems;
var tic_toc; // Timer
var refundableStoreItems =
    [{"id": "streak-purchase", "itemName": "streak_freeze", "displayName": "Streak Freeze", "price": "10"},
        {"id": "wager-purchase", "itemName": "rupee_wager", "displayName": "Double or Nothing", "price": "5"},
        {"id": "practice-purchase", "itemName": "timed_practice", "displayName": "Timed Practice", "price": "10"}];

// Initialize when the Duolingo application loads
function onHomeAdded(mutations) {
    var addedNodes, j, addedElement;
    var i = mutations.length;
    while (i--) {
        addedNodes = mutations[i].addedNodes;
        j = addedNodes.length;
        while (j--) {
            addedElement = addedNodes[j];
            if (addedElement.id === 'app' && addedElement.className === 'home') {
                main();
                onHomeAdded.lastObserver.disconnect();
                onHomeAdded.lastObserver = new MutationObserver(function onHomeChanged(mutations) {
                    var i = mutations.length;
                    while (i--) {
                        if (mutations[i].addedNodes.length) {
                            main();
                            return;
                        }
                    }
                }).observe(addedElement, {childList: true});
                return;
            }
        }
    }
}
onHomeAdded.lastObserver = { // Disconnect safely to prevent erroneous behavior
    disconnect: function () {
    }
};
new MutationObserver(onHomeAdded).observe(document.body, {childList: true});

// Are we at home or in the store? Yes? Launch the main method
if (location.pathname === '/' || location.pathname === '/show_store') {
    main();
}

// Script injector
function inject(f) {
    var script;
    script = document.createElement('script');
    script.type = 'text/javascript';
    script.textContent = f.toString();
    document.head.appendChild(script);
}

// Request refund for refundable store item
function requestRefund(n, d, p) {
    var reqStrTem = "/api/1/store/refund_item?item_name=";
    var c = confirm("You are about to regain " + p + " lingots! Are you sure you want to refund " + d + "?");
    if (c) {
        $.getJSON(reqStrTem + n, function (json) {
            if (typeof(json.response) !== 'undefined') {
                location.reload();
            }
        });
    }
}

// Inject store text to complement refund functionality
function injectStoreText() {
    var refundInfo = '<li id="refund-info"><strong class="title"><span class="store-earn">Claiming refunds</span></strong> <span ' +
        'class="store-desc">Regain the <strong>same number of lingots</strong> it took to purchase a store item ' +
        '<i>(only applicable for some store items)</i></span></li>';
    if ($('#refund-info').length == 0)
    {
        $(".store-text").find("ul").prepend(refundInfo);
    }
}

// Generate refund button for given store item.
function generateRefundBtn(storeItem) {
    return '<a onclick="requestRefund(\'' + storeItem.itemName + '\',\'' + storeItem.displayName + '\',\'' + storeItem.price + '\');"' +
        ' class="item-purchase item-refund-' + storeItem.id + ' btn btn-green right">' + '<span class="margin-right">Refund:</span><span' +
        ' class="icon icon-lingot-small">' + '</span><span class="price"> +' + storeItem.price + '</span></a>'
}

// Determine refundable store items
function determineRefunds() {
    $.each(refundableStoreItems, function (i, storeItem) {
        var item = $("#" + storeItem.id);
        if (item.hasClass("purchased")) {
            var refundBtn = generateRefundBtn(storeItem);
            if (duo.user.toJSON().inventory.hasOwnProperty(storeItem.itemName) && $('.item-refund-' + storeItem.id).length == 0) {
                item.parent().prepend(refundBtn);
            }
        }
    });
}


// Initialize
function initRefundStoreItems() {
    // Administer injections. This will only sting a little
    inject(injectStoreText);
    inject(requestRefund);
    inject(generateRefundBtn);
    inject(determineRefunds);

    // Keep current. Stay relevant
    tic_toc = window.setInterval(function () {
        if (duo.view === "home") {
            determineRefunds();
            injectStoreText();
        }
    }, 100);
}