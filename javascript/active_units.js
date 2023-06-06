/**
 * [TODO] Give a badge on ControlNet Accordion indicating total number of active 
 * units.
 * Give a dot indicator on each ControlNet unit tab, indicating whether
 * the unit is active.
 */
const cnetAllUnits = new Map/* <Element, GradioTab> */();

onUiUpdate(() => {
    function childIndex(element) {
        // Get all child nodes of the parent
        let children = Array.from(element.parentNode.childNodes);

        // Filter out non-element nodes (like text nodes and comments)
        children = children.filter(child => child.nodeType === Node.ELEMENT_NODE);

        return children.indexOf(element);
    }

    class GradioTab {
        constructor(tab) {
            this.enabledCheckbox = tab.querySelector('.cnet-unit-enabled input');
            const tabs = tab.parentNode;
            this.tabNav = tabs.querySelector('.tab-nav');
            this.tabIndex = childIndex(tab) - 1; // -1 because tab-nav is also at the same level.            

            this.attachEnabledButtonListener();
            this.attachTabNavChangeObserver();
        }

        getTabNavButton() {
            return this.tabNav.querySelector(`:nth-child(${this.tabIndex + 1})`);
        }
        
        applyActiveState() {
            const tabNavButton = this.getTabNavButton();
            if (!tabNavButton) return;

            if (this.enabledCheckbox.checked) {
                tabNavButton.classList.add('cnet-unit-active'); 
            } else {
                tabNavButton.classList.remove('cnet-unit-active'); 
            }
        }

        attachEnabledButtonListener() {
            this.enabledCheckbox.addEventListener('change', () => {
                this.applyActiveState();
            });
        }

        /**
         * Each time the active tab change, all tab nav buttons are cleared and
         * regenerated by gradio. So we need to reapply the active states on 
         * them.
         */
        attachTabNavChangeObserver() {
            const observer = new MutationObserver((mutationsList, observer) => {
                for(const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        this.applyActiveState();
                    }
                }
            });
            observer.observe(this.tabNav, { childList: true });
        }
    }

    gradioApp().querySelectorAll('.cnet-unit-tab').forEach(tab => {
        if (cnetAllUnits.has(tab)) return;
        cnetAllUnits.set(tab, new GradioTab(tab));
    });
});
