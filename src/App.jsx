import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import logo from "./assets/WebShield.png";

const InputList = ({ value, onDelete }) => {
  const handleDelete = () => {
    onDelete();
  };

  return (
    <div className="input-list-item">
      <input type="text" value={value} readOnly className="input-box" />
      <button className="delete-button" onClick={handleDelete}>
        &#10006;
      </button>
    </div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSystemOn, setIsSystemOn] = useState(() => {
    return localStorage.getItem("isSystemOn") === "true" || false;
  });
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [currentWebsite, setCurrentWebsite] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [inputList, setInputList] = useState(() => {
    const storedInputList = localStorage.getItem("inputList");
    return storedInputList ? JSON.parse(storedInputList) : [];
  });
  const [duplicateInputMessage, setDuplicateInputMessage] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const settingsIconRef = useRef(null);

  

  useEffect(() => {
    const currentSettingsIconRef = settingsIconRef.current;

    const updateSettingsMenu = () => {
      const settingsMenu = document.getElementById("settingsMenu");

      if (isSettingsOpen && settingsMenu) {
        settingsMenu.style.right = "0%";
        settingsMenu.style.opacity = "1";
        currentSettingsIconRef.classList.add("rotate");
        const toggleButtons = settingsMenu.querySelectorAll(".toggle-btn");
        toggleButtons.forEach((toggleBtn) => {
          toggleBtn.addEventListener("click", () => {
            toggleBtn.classList.toggle("active");
          });
        });
      } else if (settingsMenu) {
        settingsMenu.style.right = "-100%";
        settingsMenu.style.opacity = "0";
        currentSettingsIconRef.classList.remove("rotate");
        const toggleButtons = settingsMenu.querySelectorAll(".toggle-btn");
        toggleButtons.forEach((toggleBtn) => {
          toggleBtn.removeEventListener("click", () => {});
        });
      }
    };

    updateSettingsMenu();

    currentSettingsIconRef.addEventListener("click", updateSettingsMenu);

    return () => {
      currentSettingsIconRef.removeEventListener("click", updateSettingsMenu);
    };
  }, [isSettingsOpen]);

  useEffect(() => {
    setIsButtonClicked(true);
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab) {
        setCurrentWebsite(new URL(currentTab.url).hostname);
        setIsBlocked(inputList.includes(new URL(currentTab.url).hostname));
      }
    });

    const listener = (message) => {
      if (message.message === "urlChanged") {
        setCurrentWebsite(new URL(message.url).hostname);
        setIsBlocked(inputList.includes(new URL(message.url).hostname));
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [inputList]);

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  useEffect(() => {
    checkOnlineStatus();

    const handleOnline = () => {
      checkOnlineStatus();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOnline);
    };
  }, []);

  const handleButtonClick = () => {
    if (!isLoading) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const newSystemState = !isSystemOn;
        setIsSystemOn(newSystemState);
        setIsButtonClicked(true);

        localStorage.setItem("isSystemOn", String(newSystemState));

        console.log('Sending system state update message:', newSystemState);
        chrome.runtime.sendMessage({ message: 'systemState', isSystemOn: newSystemState });
      }, 1000);
    }
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen((prevState) => !prevState);
  };

  const handleChange = (event) => {
    setInputValue(event.target.value);
    setDuplicateInputMessage("");
  };

  const handleSubmit = () => {
    if (inputValue.trim() !== "") {
      if (inputList.includes(inputValue.trim())) {
        setDuplicateInputMessage("This input is already in the list.");
      } else {
        const newList = [...inputList, inputValue.trim()];
        setInputList(newList);
        localStorage.setItem("inputList", JSON.stringify(newList));
        setInputValue("");
        setDuplicateInputMessage("");

        chrome.runtime.sendMessage({ message: 'inputList', inputList: newList });
      }
    }
  };

  const handleDelete = (index) => {
    const newList = [...inputList];
    newList.splice(index, 1);
    setInputList(newList);
    localStorage.setItem("inputList", JSON.stringify(newList));

    chrome.runtime.sendMessage({ message: 'inputList', inputList: newList });
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="container">
      <div className="header">
        <img src={logo} alt="Logo" className="logo"/>
        <div
          className="settings-icon"
          id="settingsIcon"
          ref={settingsIconRef}
          onClick={handleSettingsClick}
        >
          ⚙️
        </div>
      </div>
      <h1 className="extension-title">Keep Your Browser Secured</h1>
      <p className="extension-description">
        Once enabled, navigate to the settings and add the websites you wish to block.
      </p>
      <div className="button-container">
        <button
          className={`button ${isLoading ? "loading" : ""}`}
          onClick={handleButtonClick}
          disabled={!isSystemOn && !isOnline}
        >
          {isLoading ? (
            <span className="spinner"></span>
          ) : (
            <>{isSystemOn ? "Turn Off" : "turn On"}</>
          )}
        </button>
        {isButtonClicked && (
          <p className="button-clicked">
            webshield is - {isSystemOn ? "enabled" : "disabled"}
          </p>
        )}
        {isSystemOn && isOnline && (
          <p className="current-website">
            {currentWebsite === "invalid" || currentWebsite === chrome.runtime.id
              ? "Your site is blocked"
              : `You are in - ${currentWebsite}`}
          </p>
        )}
        {!isOnline && <p className="disconnected-message">You are disconnected</p>}
      </div>

      <div
        className={`settings-menu ${isSettingsOpen ? "open" : ""}`}
        id="settingsMenu"
      >
        <div className="input-section">
          <h2 className="input-section-heading">Instructions</h2>
          <p className="input-section-description">
          Add the website URL without "https://", e.g., "example.com". If you are uncertain about the correct url of the website that you want to block, visit the site and open WebShield. Turn on the extension and it will show the current url you are in.
          </p>
          <input
            type="text"
            placeholder="Enter the website"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            className="input-box"
          />
          <button className="submit-button" onClick={handleSubmit}>
            &#10004;
          </button>
          {duplicateInputMessage && (
            <div className="message-box">{duplicateInputMessage}</div>
          )}
        </div>

        {inputList.length > 0 && (
          <div className="input-lists">
            <h2 className="input-section-heading">Blocked Website(s)</h2>
            <div className="input-list-container">
              {inputList.map((item, index) => (
                <InputList
                  key={index}
                  value={item}
                  onDelete={() => handleDelete(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
