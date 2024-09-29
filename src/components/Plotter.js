import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import Plot from "./Plot";

import { selectStyle } from "../styles/react-select-style";

const PlotTypes = {
  bar: 'bar',
  scatter: 'scatter',
  heatmap: 'heatmap',
  multivariate: 'multivariate',
  scattermatrix: 'scattermatrix',
  histogram: 'histogram'
}

const PlottingFns = {
  [PlotTypes.heatmap]: (df, columns) => {
    return {
      data: {
        z: [columns.map(column => df[column].values)],
        type: 'heatmap'
      }
    }
  },
  [PlotTypes.multivariate]: (df, columns) => {
    return {
      data: {
        type: 'paracords',
        dimensions: [
          columns.map(column => ({ label: column, values: df[column].values }))
        ]
      }
    }
  },
  [PlotTypes.scatter]: (df, columns) => {
    let [x, y] = columns;
    return {
      data: {
        x: df[x].values, y: df[y].values,
        textposition: 'auto',
        type: 'scatter',
        mode: 'markers',
      },
      layout: { title: 'Chart', bargap: 0.05 }
    }
  },
  [PlotTypes.histogram]: (df, columns) => {
    return {
      data: {
        type: 'histogram',
        x: df[columns[0]].values,
      }
    }
  },
  [PlotTypes.scattermatrix]: (df, columns) => {
    return {
      data: {
        type: 'sploom',
        dimensions: [
          columns.map(column => ({ label: column, values: df[column].values }))
        ]
      }
    }
  },
  [PlotTypes.bar]: (df, columns) => {
    let [x, y] = columns;
    return {
      data: {
        x: df[x].values, y: df[y].values,
        textposition: 'auto',
        type: 'bar',
      },
      layout: { title: 'Chart', bargap: 0.05 }
    }
  },
}

const MultiSelectPlot = ({ df, plottingFn, setShowPlot }) => {
  const selectRef = useRef(null);

  const options = df.columns.map(column => ({ label: column, value: column }));

  const handleApply = () => {
    let columns = selectRef.current.getValue().map(option => option.value)

    if (!columns.length) {
      setShowPlot({ status: false })
      return;
    }

    setShowPlot({
      status: true,
      plot: plottingFn(df, columns)
    })
  }

  return (
    <section className="plot-controls flex flex-row" style={{ gap: '16px', alignItems: 'center' }}>
      <Select
        isClearable
        isMulti
        isSearchable
        ref={selectRef}
        hideSelectedOptions={true}
        styles={selectStyle}
        options={options}
      />
      <button type="button" onClick={handleApply} className='Button Btn-blue'>Plot</button>
    </section>
  )

}

const TwoDPlotter = ({ df, plottingFn, setShowPlot }) => {
  const xRef = useRef(null);
  const yRef = useRef(null);

  const options = df.columns.map(column => ({ label: column, value: column }));

  const handleApply = () => {
    const xVal = xRef.current.getValue()[0];
    const yVal = yRef.current.getValue()[0];

    let coords = new Set([xVal.value, yVal.value]);
    if (coords.size < 2) {
      setShowPlot({ status: false })
      return;
    }

    setShowPlot({
      status: true,
      plot: plottingFn(df, coords),
    })
  }

  return (
    <section className="plot-controls flex flex-row" style={{ gap: '16px', alignItems: 'center' }}>
      <Select
        isClearable
        isSearchable
        ref={xRef}
        hideSelectedOptions={true}
        styles={selectStyle}
        options={options}
      />
      <Select
        isClearable
        isSearchable
        ref={yRef}
        hideSelectedOptions={true}
        styles={selectStyle}
        options={options}
      />
      <button type="button" onClick={handleApply} className='Button Btn-blue'>Plot</button>
    </section>
  )

}

const Plotter = ({ df }) => {
  const [showPlot, setShowPlot] = useState({ status: false })
  const [plotterDf, setPlotterDf] = useState(null);
  const [chartType, setChartType] = useState('');

  const charts = Object.keys(PlotTypes).map(ct => ({ value: ct, label: `${ct[0].toUpperCase()}${ct.slice(1)}` }))

  useEffect(() => {

    const load = async () => {
      if (df.shape[0] > 2000) {
        setPlotterDf(await df.sample(2000))
      } else {
        setPlotterDf(df)
      }
    }

    load();

  }, [df])

  const renderPlotter = () => {
    if (!plotterDf) return null;

    if (chartType === PlotTypes.bar) {
      return <TwoDPlotter df={df} plottingFn={PlottingFns.bar} setShowPlot={setShowPlot} key='bar' />
    }

    if (chartType === PlotTypes.scatter) {
      return <TwoDPlotter df={df} plottingFn={PlottingFns.scatter} setShowPlot={setShowPlot} key='scatter' />
    }

    if (chartType === PlotTypes.scattermatrix) {
      return <MultiSelectPlot df={df} plottingFn={PlottingFns.scattermatrix} setShowPlot={setShowPlot} key='scattermatrix' />
    }

    if (chartType === PlotTypes.multivariate) {
      return <MultiSelectPlot df={df} plottingFn={PlottingFns.multivariate} setShowPlot={setShowPlot} key='multivariate' />
    }

    if (chartType === PlotTypes.heatmap) {
      return <MultiSelectPlot df={df} plottingFn={PlottingFns.heatmap} setShowPlot={setShowPlot} key='heatmap' />
    }

    return null;
  }

  console.log(chartType, "chartType", showPlot.plot);

  return (
    <section className="plotter margin-b-xl">
      <h3 className="margin-b-m">Plot your results</h3>
      <section className="plotter-ui-container margin-b-m">
        <header className="flex flex-row margin-b-xl" style={{ gap: '16px', alignItems: 'center' }}>
          <p>Chart Type:</p>
          <Select
            isClearable
            styles={selectStyle}
            options={charts}
            hideSelectedOptions={true}
            onChange={(e) => setChartType(e && e.value)}
          />

          {renderPlotter()}
        </header>
        {showPlot.status ? <Plot data={[showPlot.plot.data]} layout={showPlot.plot.layout} /> : null}
      </section>
    </section>
  )
}

export default Plotter;
