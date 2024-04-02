// Function to extract domain from URL
function extractDomain(url) {
  // Remove protocol if exists
  let domain = url.replace(/^https?:\/\//i, '');
  // Remove www. if exists
  domain = domain.replace(/^www\./i, '');

  // Get the hostname from the URL
  try {
    domain = new URL('http://' + domain).hostname;
  } catch (error) {
    // If there's an error in URL parsing, return the original domain
    return domain;
  }

  // Extract subdomains
  const parts = domain.split('.');
  if (parts.length > 2) {
    // Check if the last part is a TLD (Top Level Domain)
    if (parts[parts.length - 1].length <= 3) {
      // Handles cases like co.uk, com.au, etc.
      domain = parts.slice(-3).join('.');
    } else {
      domain = parts.slice(-2).join('.');
    }
  }

  return domain;
}

// Function to check if the current URL matches any of the blocked websites
function checkBlockedWebsite(blockedWebsites) {
  const currentDomain = extractDomain(window.location.href);
  const currentDomainWithWWW = `www.${currentDomain}`;
  return blockedWebsites.includes(currentDomain) || blockedWebsites.includes(currentDomainWithWWW);
}

// Retrieve the list of blocked websites and system state from extension storage
let blockedWebsites = [];
let isSystemOn = false;

chrome.storage.sync.get(['blockedWebsites', 'isSystemOn'], function(result) {
  blockedWebsites = result.blockedWebsites || [];
  isSystemOn = result.isSystemOn || false;
  console.log('blockedWebsites:', blockedWebsites);
  console.log('isSystemOn:', isSystemOn);

  // Check if the current website is blocked
  if (isSystemOn && checkBlockedWebsite(blockedWebsites)) {
    // Send a message to the background script to block the website
    chrome.runtime.sendMessage({ message: 'blockWebsite' });
  }
});

// Monitor URL changes and check if the new URL matches any blocked website
window.addEventListener('hashchange', () => {
  chrome.storage.sync.get(['blockedWebsites', 'isSystemOn'], function(result) {
    blockedWebsites = result.blockedWebsites || [];
    isSystemOn = result.isSystemOn || false;
    console.log('blockedWebsites:', blockedWebsites);
    console.log('isSystemOn:', isSystemOn);

    if (isSystemOn && checkBlockedWebsite(blockedWebsites)) {
      // Send a message to the background script to block the website
      chrome.runtime.sendMessage({ message: 'blockWebsite' });
    }
  });
});

// Monitor URL changes and check if the new URL matches any blocked website
window.addEventListener('locationchange', () => {
  chrome.storage.sync.get(['blockedWebsites', 'isSystemOn'], function(result) {
    blockedWebsites = result.blockedWebsites || [];
    isSystemOn = result.isSystemOn || false;
    console.log('blockedWebsites:', blockedWebsites);
    console.log('isSystemOn:', isSystemOn);

    if (isSystemOn && checkBlockedWebsite(blockedWebsites)) {
      // Send a message to the background script to block the website
      chrome.runtime.sendMessage({ message: 'blockWebsite' });
    }
  });
});