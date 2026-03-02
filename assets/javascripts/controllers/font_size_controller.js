(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const { Controller } = await import('@hotwired/stimulus');

  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
  const LABELS = { xs: 'Très petit', sm: 'Petit', md: 'Normal', lg: 'Grand', xl: 'Très grand' };

  Stimulus.register("font-size", class extends Controller {
    static targets = ["input", "label"]

    get currentIndex() {
      return Math.max(0, SIZES.indexOf(this.inputTarget.value));
    }

    increase() {
      const next = Math.min(SIZES.length - 1, this.currentIndex + 1);
      this.apply(next);
    }

    decrease() {
      const prev = Math.max(0, this.currentIndex - 1);
      this.apply(prev);
    }

    apply(index) {
      const size = SIZES[index];
      this.inputTarget.value = size;
      this.labelTarget.textContent = LABELS[size];

      // Live preview: update html class
      SIZES.forEach(s => document.documentElement.classList.remove(`font-size-${s}`));
      document.documentElement.classList.add(`font-size-${size}`);
    }
  });
})();
