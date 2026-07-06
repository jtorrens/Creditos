(function (root) {
  function createAppMovExportProgress(options = {}) {
    const documentRef = options.documentRef || root.document;
    const windowRef = options.windowRef || root;
    const state = options.state;
    const els = options.els;

    function updateMovExportProgress(currentFrame, totalFrames) {
      if (!els.exportMovBtn) return;
      const total = Math.max(1, Math.round(Number(totalFrames) || 1));
      const current = Math.max(0, Math.min(total, Math.round(Number(currentFrame) || 0)));
      els.exportMovBtn.textContent = `${current}/${total} frames`;
      if (state.movExportProgress) state.movExportProgress.update(current, total);
    }

    function openMovExportProgressModal() {
      const overlay = documentRef.createElement('div');
      overlay.className = 'modal-overlay';
      const modal = documentRef.createElement('div');
      modal.className = 'app-modal mov-export-modal';
      const title = documentRef.createElement('h2');
      title.textContent = 'Exportando MOV';
      const status = documentRef.createElement('p');
      status.textContent = 'Preparando frames...';
      const progress = documentRef.createElement('progress');
      progress.className = 'mov-export-progress';
      progress.max = 1;
      progress.value = 0;
      const counter = documentRef.createElement('div');
      counter.className = 'mov-export-counter';
      counter.textContent = '0 / 0 frames';
      const actions = documentRef.createElement('div');
      actions.className = 'modal-actions';
      const cancelButton = documentRef.createElement('button');
      cancelButton.type = 'button';
      cancelButton.textContent = 'Cancelar';
      actions.appendChild(cancelButton);
      modal.appendChild(title);
      modal.appendChild(status);
      modal.appendChild(progress);
      modal.appendChild(counter);
      modal.appendChild(actions);
      overlay.appendChild(modal);
      documentRef.body.appendChild(overlay);

      let cancelRequested = false;
      let cancelHandler = null;
      cancelButton.addEventListener('click', async () => {
        if (cancelRequested) return;
        const native = options.nativeBridge();
        let confirmed = false;
        if (native && native.confirm) {
          const result = await native.confirm({
            title: 'Cancelar exportación',
            message: '¿Quieres cancelar la exportación MOV en curso?',
            confirmLabel: 'Cancelar exportación',
          });
          confirmed = !!(result && result.confirmed);
        } else {
          confirmed = windowRef.confirm('¿Quieres cancelar la exportación MOV en curso?');
        }
        if (!confirmed) return;
        cancelRequested = true;
        cancelButton.disabled = true;
        status.textContent = 'Cancelando exportación...';
        if (cancelHandler) await cancelHandler().catch(() => {});
      });

      return {
        update(current, total) {
          const safeTotal = Math.max(1, Math.round(Number(total) || 1));
          const safeCurrent = Math.max(0, Math.min(safeTotal, Math.round(Number(current) || 0)));
          progress.max = safeTotal;
          progress.value = safeCurrent;
          counter.textContent = `${safeCurrent} / ${safeTotal} frames`;
        },
        setPhase(message) {
          if (!cancelRequested) status.textContent = message;
        },
        setCancelHandler(handler) {
          cancelHandler = handler;
          if (cancelRequested && cancelHandler) cancelHandler().catch(() => {});
        },
        isCancellationRequested() {
          return cancelRequested;
        },
        close() {
          overlay.remove();
        },
      };
    }

    function throwIfMovExportCancelled() {
      if (!state.movExportProgress || !state.movExportProgress.isCancellationRequested()) return;
      const error = new Error('Exportación cancelada.');
      error.name = 'AbortError';
      throw error;
    }

    return {
      openMovExportProgressModal,
      throwIfMovExportCancelled,
      updateMovExportProgress,
    };
  }

  root.CreditosAppMovExportProgress = {
    createAppMovExportProgress,
  };
})(globalThis);
