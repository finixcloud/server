export default class TabbingRestriction {
	constructor(element) {
	  this.container = element;
	  this.restrictTabbingListener = this.restrictTabbing.bind(this);
	  this.generalKeyDownListener = this.transferEvent.bind(this);
	  this.focusableElements = [];
	  document.addEventListener("keydown", this.generalKeyDownListener);
	  this.container.addEventListener("keydown", this.restrictTabbingListener);
	}
  
	transferEvent(e) {
	  if (e.key === "Tab" || e.keyCode === 9) {
		const focusableEls = this.container.querySelectorAll(
		  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);
		this.focusableElements = focusableEls;
		// Tab event is outside container stop default action and transfer event into container
		if (!this.container.contains(e.target)) {
		  e.preventDefault();
		  var tabEvent = new KeyboardEvent("keydown", {
			key: "Tab",
			bubbles: true,
			cancelable: true,
		  });
		  focusableEls[2].dispatchEvent(tabEvent);
		}
	  }
	}
  
	restrictTabbing(e) {
	  if (e.key === "Tab" || e.keyCode === 9) {
		const focusableEls = this.focusableElements;
		e.target.focus();
		if (this.container.contains(e.target)) {
		  const currentIdx = Array.from(focusableEls).indexOf(e.target);
		  if (e.shiftKey && currentIdx === 0) {
			focusableEls[focusableEls.length - 1].focus();
		  } else if (!e.shiftKey && currentIdx === focusableEls.length - 1) {
			focusableEls[0].focus();
		  }
		}
	  }
	}
  
	removeTabbingRestriction() {
	  document.removeEventListener("keydown", this.generalKeyDownListener);
	  this.container.removeEventListener("keydown", this.restrictTabbingListener);
	}
  }
