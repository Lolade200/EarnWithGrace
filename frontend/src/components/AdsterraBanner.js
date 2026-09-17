import React, { useEffect, useRef } from "react";

export default function AdsterraBanner({ zoneKey, width = 300, height = 250 }) {
  const bannerRef = useRef(null);

  useEffect(() => {
    if (bannerRef.current) {
      bannerRef.current.innerHTML = "";

      const atOptionsScript = document.createElement("script");
      atOptionsScript.type = "text/javascript";
      atOptionsScript.innerHTML = `
        atOptions = {
          'key' : '${zoneKey}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;

      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = `//www.highperformanceformat.com/${zoneKey}/invoke.js`;

      bannerRef.current.appendChild(atOptionsScript);
      bannerRef.current.appendChild(invokeScript);
    }
  }, [zoneKey, width, height]);

  return <div ref={bannerRef} className="click-ad-frame-container" />;
}
