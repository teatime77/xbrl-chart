declare var Chart:any;
declare var Plotly:any;

let addChartDlg : HTMLDialogElement;
let addChartSel : HTMLSelectElement;

let charts : MyChart[] = [];

const chartMargin = {
    l: 40,
    r: 1,
    b: 1,
    t: 40,
    pad: 1,
};

enum ChartType {
    Scatter,
    Bar,
    Table,
    Line,
    Bubble,
}

class MyChart {
    static type: ChartType;
    chart: any = null;
    titles: string[] = [];
    minx : number = 0;
    miny : number = 0;
    maxx : number = 0;
    maxy : number = 0;
    divChart: HTMLElement;
    divTempl: HTMLDivElement;
    btnClose: HTMLButtonElement;
    screenX: number = NaN;
    screenY: number = NaN;
    downW: number = NaN;
    downH: number = NaN;
    arrow: HTMLImageElement;
    arrowX: number = NaN;
    arrowY: number = NaN;

    constructor(titles: string[]){
        charts.push(this);
        this.titles = titles;

        this.divTempl = getDom("chart-template")!.cloneNode(true) as HTMLDivElement;
        this.divTempl.style.display = "grid";   // "inline-block";
    
        this.divChart = this.divTempl.getElementsByClassName("chart_class")[0] as HTMLElement;
        this.btnClose = this.divTempl.getElementsByClassName("close")[0] as HTMLButtonElement;
        this.btnClose.onclick = this.close;

        this.arrow = this.divTempl.getElementsByClassName("arrow")[0] as HTMLImageElement;
        this.arrow.id = `arrow-${charts.length}`;
        this.arrow.ondragstart = this.dragStart;
        this.arrow.ondragend   = this.dragEnd;

        getDom('category-btn').style.display = "none";
        getDom("chart-flex")!.appendChild(this.divTempl);
    }

    close = (ev: MouseEvent)=>{
        let i = charts.indexOf(this);
        console.assert(i != -1);
        if(i == 0){
            charts.map(x => x.divTempl.parentNode!.removeChild(x.divTempl));
            charts = [];
        }
        else{

            this.divTempl.parentNode!.removeChild(this.divTempl);
            charts.splice(i, 1);
        }

        if(charts.length == 0){
            getDom('category-btn').style.display = "inline-block";
            getDom("add-chart-div").style.display = "none";
        }
    }

    dragStart = (ev: DragEvent)=>{
        ev.dataTransfer!.effectAllowed = "move";
        document.body.ondragover = this.dragOver;
        document.body.ondrop = this.drop;

        this.screenX = ev.screenX;
        this.screenY = ev.screenY;

        console.log(`start: ${this.arrow.id} ${this.arrow.offsetLeft} ${this.arrow.offsetTop} `);
    }

    dragEnd = (ev: DragEvent)=>{
        document.body.ondragover = null;
        document.body.ondrop = null;

        if(isNaN(this.screenX)){
            return;
        }

        let dx = ev.screenX - this.screenX;
        let dy = ev.screenY - this.screenY;

        console.log(`end : ${this.arrow.offsetLeft} ${this.arrow.offsetTop} `);

        this.divChart.style.width  = `${Math.max(300, this.divChart.offsetWidth  + dx)}px`;
        this.divChart.style.height = `${Math.max(300, this.divChart.offsetHeight + dy)}px`;

        setTimeout(()=>{
            console.log("start draw Chart");
            this.drawChart();
            console.log("end   draw Chart");
        },100);


        this.screenX = this.screenY = this.downW = this.downH = NaN;
    }

    dragOver = (ev: DragEvent)=>{
        // console.log(`over : ${ev.screenX - this.screenX} ${ev.screenY - this.screenY} `);
        ev.preventDefault();
        // Set the dropEffect to move
        ev.dataTransfer!.dropEffect = "move"
    }

    drop = (ev: DragEvent)=>{
        ev.preventDefault();
        console.log("dropped");
    }

    drawChart(){}

    getSelection() : string[] {
        let i = charts.indexOf(this);
        console.assert(i != 0);
        return charts[i - 1].getSelection();
    }

    static makeChart(){
        let chart: MyChart;

        let titles = Array.from(addChartSel.selectedOptions).map(x => x.innerText);

        switch(MyChart.type){
        case ChartType.Scatter:
            chart = new ScatterChart(titles);
            chart.drawChart(); 
            break;

        case ChartType.Bar:
            chart = new BarChart(titles);
            chart.drawChart();
            break;
            
        case ChartType.Line:
            if(titles.length != 1){
                return;
            }
            chart = new LineChart(titles);

            chart.drawChart(); 
            break;
        }
    }
}

class BarChart extends MyChart {
    constructor(titles: string[]){
        super(titles);
    }

    drawChart(){    
        let df = selectData(直近集計, this.getSelection(), this.titles);

        let iname = df.columnIdx('会社名');
        let icols = this.titles.map(title => df.columnIdx(title));
        
        let traces = [];
        for(let idx of range(df.count())){

            let name = df.arrays[iname][idx];
            let values = icols.map(icol => df.arrays[icol][idx]);

            let trace = {
                x: this.titles,
                y: values,
                name: name,
                type: 'bar'
              };
    
            traces.push(trace);
        }
          
        var layout = {
            barmode: 'group', 
            title: this.titles.join(', '),
            margin: chartMargin,
            xaxis:{ automargin: true },
            yaxis:{ automargin: true },
         };

        Plotly.newPlot(this.divChart, traces, layout, {
            displaylogo: false,
            modeBarButtons: [[]]
        });        
    }
}


class LineChart extends MyChart {
    constructor(titles: string[]){
        super(titles);
    }

    drawChart(){
        let selection = this.getSelection();

        let title = this.titles[0];

        let df = joinTable(集計, selection, this.titles);

        let traces = [];
        for(let code of selection){
            let tbl = df.selectValue('EDINETコード', code);

            var trace = {
                x: tbl.column('会計期間終了日'),
                y: tbl.column(title),
                name: 会社名[code],
                type: 'scatter'
            };
    
            traces.push(trace);
        }

        var layout = {
            title: title,
            margin: chartMargin,
            xaxis:{ automargin: true },
            yaxis:{ automargin: true },
        };

        Plotly.newPlot(this.divChart, traces, layout, {
            displaylogo: false,
            modeBarButtons: [[ ]]
        });        
    }
}

class ScatterChart extends MyChart {
    selection: string[] = [];
    categoryTbls: Table[] = [];
    rangeX: number[] = [];
    rangeY: number[] = [];

    constructor(titles: string[]){
        super(titles);
    }

    getSelection() : string[] {
        if(this.selection.length != 0){
            return this.selection;
        }

        
        if(charts[0] == this){

            return selectedCategories.map(name => 業種[name]).flat();
        }
        else{

            return super.getSelection();
        }
    }

    drawChart(){
        let df = selectData(直近集計, this.getSelection(), this.titles);

        this.categoryTbls = selectedCategories.map(name => df.selectValue('業種', name));

        let data: any[] = [];
        for(let [idx, [category_name, df2]] of zip(selectedCategories, this.categoryTbls).entries() ){
            let xs = df2.column(this.titles[0]);
            let ys = df2.column(this.titles[1]);
            let names = df2.column('会社名');
            let value = { x: xs, y: ys, text: names, type: 'scatter', name: category_name, hoverinfo: 'text+x+y',
                mode: 'markers', 
            };
            
            data.push(value);
        }

        let layout = { 
            hovermode:'closest',
            title: this.titles.join(', '),

            // hoverformat
            //      https://plot.ly/javascript/reference/#layout-xaxis-hoverformat
            // d3.format
            //      https://github.com/d3/d3-3.x-api-reference/blob/master/Formatting.md#d3_format
            xaxis:{ 
                zeroline:true, 
                hoverformat: '.5r', 
                automargin: true,
                title: { text: this.titles[0] },
            },
            yaxis:{
                zeroline:true, 
                hoverformat: '.2r', 
                automargin: true,
                title: { text: this.titles[1] },
            },

            margin: chartMargin,
        };
    
        Plotly.newPlot(this.divChart, data, layout,
            {
                // Hide the Plotly Logo on the Modebar
                //      https://plot.ly/javascript/configuration-options/#hide-the-plotly-logo-on-the-modebar
                displaylogo: false,

                // How To Customize Plotly's Modebar
                //      https://www.somesolvedproblems.com/2018/10/how-to-customize-plotlys-modebar.html
                // Remove Lasso Select, Box Select & Toggle Spike Lines from Mode Bar
                //      https://community.plot.ly/t/remove-lasso-select-box-select-toggle-spike-lines-from-mode-bar/23942
                modeBarButtons: [[ "pan2d", "select2d", "zoomIn2d", "zoomOut2d"]],
            });
        
        
        (this.divChart as any).on('plotly_selected',  (ev:any)=>{
            this.rangeX = ev.range.x;
            this.rangeY = ev.range.y;
            this.selection = [];

            let codes = this.categoryTbls.map(df => df.column('EDINETコード'));
            let names = this.categoryTbls.map(df => df.column('会社名'));
            for(let point of ev.points){
                let code = codes[point.curveNumber][point.pointNumber];
                this.selection.push(code);
                console.log(`sel: ${code} ${names[point.curveNumber][point.pointNumber]}`);
            }
        });
    }
}

