// Function to retrieve blocked websites from storage on extension startup
let blockedWebsites = [];
let isSystemOn = false;

// Initialize system state
try {
  chrome.storage.sync.get(["blockedWebsites", "isSystemOn"], function(result) {
    blockedWebsites = result.blockedWebsites || [];
    isSystemOn = result.isSystemOn || false;
  });
} catch (error) {
  console.error("Error retrieving data from storage:", error);
}

// Function to update blocked websites in storage
function updateBlockedWebsites() {
  chrome.storage.sync.set({ blockedWebsites: blockedWebsites }, function() {
    console.log("Blocked websites updated:", blockedWebsites);
  });
}

// Function to update system state
function updateSystemState(newState) {
  isSystemOn = newState;
  chrome.storage.sync.set({ isSystemOn: isSystemOn }, function() {
    console.log("System state updated:", isSystemOn ? "on" : "off");
  });
}

// Function to extract domain from URL
function extractDomain(url) {
  // Remove protocol if exists
  let domain = url.replace(/^https?:\/\//i, "");

  // Remove www. if exists
  domain = domain.replace(/^www\./i, "");

  // Get the hostname from the URL
  try {
    domain = new URL("http://" + domain).hostname;
  } catch (error) {
    // If there's an error in URL parsing, return the original domain
    return domain;
  }

  // Extract subdomains
  const parts = domain.split(".");
  if (parts.length > 2) {
    // Check if the last part is a TLD (Top Level Domain)
    if (parts[parts.length - 1].length <= 3) {
      // Handles cases like co.uk, com.au, etc.
      domain = parts.slice(-3).join(".");
    } else {
      domain = parts.slice(-2).join(".");
    }
  }

  // Add www. prefix back if it exists in the original URL
  if (url.includes("www.")) {
    domain = "www." + domain;
  }

  return domain;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "systemState") {
    updateSystemState(request.isSystemOn);

    // Check and block currently active tabs if the system is turned on
    if (request.isSystemOn) {
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
          chrome.webNavigation.getAllFrames({ tabId: tab.id }, function(details) {
            details.forEach((frame) => {
              const website = extractDomain(frame.url);
              if (!isSearchPage(frame.url) && blockedWebsites.includes(website)) {
                console.log("Blocking:", website);
                chrome.tabs.update(frame.tabId, { url: "chrome-extension://" + chrome.runtime.id + "/nonexistent.html" });
              }
            });
          });
        });
      });
    }
  }

  if (request.message === "inputList") {
    console.log("Input list:", request.inputList);
    const newBlockedWebsites = request.inputList;
    const addedWebsites = newBlockedWebsites.filter(website => !blockedWebsites.includes(website));

    // If the system is on, block any newly added websites
    if (isSystemOn) {
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
          chrome.webNavigation.getAllFrames({ tabId: tab.id }, function(details) {
            details.forEach((frame) => {
              const website = extractDomain(frame.url);
              if (!isSearchPage(frame.url) && addedWebsites.includes(website)) {
                console.log("Blocking:", website);
                chrome.tabs.update(frame.tabId, { url: "chrome-extension://" + chrome.runtime.id + "/nonexistent.html" });
              }
            });
          });
        });
      });
    }

    blockedWebsites = newBlockedWebsites;
    updateBlockedWebsites();

    // Do not update tab URLs when the system is off
  }
});

chrome.webNavigation.onCommitted.addListener((details) => {
  const website = extractDomain(details.url);
  console.log("Checking:", website, "System state:", isSystemOn);

  if (details.frameId === 0 && !isSearchPage(details.url) && isSystemOn && blockedWebsites.includes(website)) {
    console.log("Blocking:", website);
    chrome.tabs.update(details.tabId, { url: "chrome-extension://" + chrome.runtime.id + "/nonexistent.html" });
  }
});

function isSearchPage(url) {
  // Define a regular expression pattern to match Google search engine results pages
  const searchPagePattern = /^https?:\/\/(?:www\.)?google\.[a-z]{2,3}(?:\.[a-z]{2})?\/search/i;

  // Return true if the URL matches the search page pattern, false otherwise
  return searchPagePattern.test(url);
}