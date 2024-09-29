import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

const Plot = ({ data, layout, config }) => {
  const plotRef = useRef(null);

  useEffect(() => {
    // Plotly.newPlot to render the chart
    let currPlot = plotRef.current;

    const renderPlot = async () => {
      if (currPlot) {
        try {
          await Plotly.newPlot(
            currPlot,
            data,
            layout,
            config,
          );
        } catch (err) {
          console.log('failed to render', err)
        }
      }
    }

    renderPlot();

    // Cleanup on component unmount
    return () => {
      Plotly.purge(currPlot);
    };
  }, [data, layout, config]);

  window.Plotly = Plotly;

  return <div ref={plotRef} id="plot" style={{ width: '100%', height: '100%' }} />;
};

export default Plot;
