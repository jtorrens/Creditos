(function (root) {
  function createReferenceVideoPreview(dependencies = {}) {
    const {
      documentRef = root.document,
      getCurrentFrame = () => 0,
      getReferenceVideo = () => null,
      getReferenceVideoElement = () => null,
      getReferenceVideoSrc = () => '',
      isPlaying = () => false,
      normalizeReferenceVideo = (video) => video,
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

    return {
      makeReferenceVideoElement,
      syncReferenceVideoElement,
    };
  }

  root.CreditosPreviewReferenceVideo = {
    createReferenceVideoPreview,
  };
})(globalThis);
