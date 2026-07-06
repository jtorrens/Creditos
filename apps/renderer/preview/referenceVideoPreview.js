(function (root) {
  function createReferenceVideoPreview(dependencies = {}) {
    const {
      documentRef = root.document,
      getCurrentFrame = () => 0,
      getReferenceVideo = () => null,
      getReferenceVideoCanvasElement = () => null,
      getReferenceVideoCanvasSrc = () => '',
      getReferenceVideoElement = () => null,
      getReferenceVideoSrc = () => '',
      isPlaying = () => false,
      normalizeReferenceVideo = (video) => video,
      setReferenceVideoCanvasElement = () => {},
      setReferenceVideoCanvasSrc = () => {},
      setReferenceVideoDuration = () => {},
      setReferenceVideoElement = () => {},
      setReferenceVideoSrc = () => {},
    } = dependencies;

    function makeReferenceVideoElement(plan, zoom) {
      const video = normalizeReferenceVideo(getReferenceVideo());
      if (!video || !video.file_path) return null;
      const currentFrame = Math.max(0, Number(getCurrentFrame()) || 0);
      if (currentFrame < Math.max(0, Number(plan.videoStartFrame) || 0)) return null;
      const src = `/api/reference-video?path=${encodeURIComponent(video.file_path)}`;
      if (!getReferenceVideoElement() || getReferenceVideoSrc() !== src) {
        const videoEl = documentRef.createElement('video');
        videoEl.className = 'reference-video-preview';
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.preload = 'auto';
        videoEl.src = src;
        setReferenceVideoElement(videoEl);
        setReferenceVideoSrc(src);
      }
      const videoEl = getReferenceVideoElement();
      videoEl.style.width = `${Math.max(1, Math.round(plan.layout.page_width * zoom))}px`;
      videoEl.style.height = `${Math.max(1, Math.round(plan.layout.page_height * zoom))}px`;
      syncReferenceVideoElement(videoEl, plan);
      return videoEl;
    }

    function syncReferenceVideoElement(videoEl, plan) {
      const currentFrame = Math.max(0, Number(getCurrentFrame()) || 0);
      const videoStartFrame = Math.max(0, Number(plan.videoStartFrame) || 0);
      if (currentFrame < videoStartFrame) {
        videoEl.pause();
        videoEl.style.visibility = 'hidden';
        return;
      }
      const targetFrame = currentFrame - videoStartFrame;
      const targetTime = targetFrame / Math.max(1, Number(plan.fps) || 25);
      const updateDuration = () => {
        const duration = Number(videoEl.duration);
        if (Number.isFinite(duration) && duration > 0) {
          setReferenceVideoDuration(duration);
        }
      };
      const seek = () => {
        updateDuration();
        const duration = Number(videoEl.duration);
        if (Number.isFinite(duration) && duration > 0 && targetTime >= duration) {
          videoEl.pause();
          videoEl.style.visibility = 'hidden';
          return;
        }
        videoEl.style.visibility = 'visible';
        if (Number.isFinite(duration) && duration > 0) {
          videoEl.currentTime = targetTime;
        } else {
          videoEl.currentTime = targetTime;
        }
        if (isPlaying()) {
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      };
      if (videoEl.readyState >= 1) seek();
      else videoEl.addEventListener('loadedmetadata', seek, { once: true });
    }

    async function drawReferenceVideoFrame(ctx, layout, time) {
      const video = await referenceVideoForCanvas();
      const duration = Number(video.duration);
      if (Number.isFinite(duration) && duration > 0 && time >= duration) return;
      await seekVideoForCanvas(video, time);
      const sourceWidth = video.videoWidth || layout.page_width;
      const sourceHeight = video.videoHeight || layout.page_height;
      const targetRatio = layout.page_width / layout.page_height;
      const sourceRatio = sourceWidth / sourceHeight;
      let sx = 0;
      let sy = 0;
      let sw = sourceWidth;
      let sh = sourceHeight;
      if (sourceRatio > targetRatio) {
        sw = sourceHeight * targetRatio;
        sx = (sourceWidth - sw) / 2;
      } else if (sourceRatio < targetRatio) {
        sh = sourceWidth / targetRatio;
        sy = (sourceHeight - sh) / 2;
      }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, layout.page_width, layout.page_height);
    }

    function referenceVideoForCanvas() {
      const video = normalizeReferenceVideo(getReferenceVideo());
      if (!video || !video.file_path) return Promise.reject(new Error('No hay vídeo de referencia asociado.'));
      const src = `/api/reference-video?path=${encodeURIComponent(video.file_path)}`;
      if (!getReferenceVideoCanvasElement() || getReferenceVideoCanvasSrc() !== src) {
        const videoEl = documentRef.createElement('video');
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.preload = 'auto';
        videoEl.src = src;
        setReferenceVideoCanvasElement(videoEl);
        setReferenceVideoCanvasSrc(src);
      }
      const videoEl = getReferenceVideoCanvasElement();
      if (videoEl.readyState >= 1) {
        const duration = Number(videoEl.duration);
        if (Number.isFinite(duration) && duration > 0) {
          setReferenceVideoDuration(duration);
        }
        return Promise.resolve(videoEl);
      }
      return new Promise((resolve, reject) => {
        videoEl.addEventListener('loadedmetadata', () => {
          const duration = Number(videoEl.duration);
          if (Number.isFinite(duration) && duration > 0) {
            setReferenceVideoDuration(duration);
          }
          resolve(videoEl);
        }, { once: true });
        videoEl.addEventListener('error', () => reject(new Error('No se pudo cargar el vídeo de referencia.')), { once: true });
        videoEl.load();
      });
    }

    function seekVideoForCanvas(video, time) {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (duration && time >= duration) return Promise.resolve();
      const target = duration ? Math.min(time, Math.max(0, duration - 0.001)) : time;
      if (Math.abs((Number(video.currentTime) || 0) - target) < 0.025 && video.readyState >= 2) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const cleanup = () => {
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
        };
        const onSeeked = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error('No se pudo leer el frame del vídeo de referencia.'));
        };
        video.addEventListener('seeked', onSeeked, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.currentTime = target;
      });
    }

    return {
      drawReferenceVideoFrame,
      makeReferenceVideoElement,
      referenceVideoForCanvas,
      seekVideoForCanvas,
      syncReferenceVideoElement,
    };
  }

  root.CreditosPreviewReferenceVideo = {
    createReferenceVideoPreview,
  };
})(globalThis);
