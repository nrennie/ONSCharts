import { initialise, wrap, addSvg } from "../lib/helpers.js";

let graphic = d3.select('#graphic');
//console.log(`Graphic selected: ${graphic}`);

let pymChild = null;
let graphic_data, size;

function drawGraphic() {

	//Set up some of the basics and return the size value ('sm', 'md' or 'lg')
	size = initialise(size);

	// Define the dimensions and margin, width and height of the chart.
	let margin = config.optional.margin[size];
	// let width = parseInt(graphic.style('width')) - margin.left - margin.right;
	let height = config.optional.chartHeight[size];
	let width = config.optional.chartWidth[size];
	// console.log(parseInt(graphic.style('width')) - width - margin.left - 75)
	// console.log(`Margin, width, and height set: ${margin}, ${width}, ${height}`);

	// Get categories from the keys used in the stack generator
	const categories = Object.keys(graphic_data[0]).filter((k) => k !== 'date');
	// console.log(`Categories retrieved: ${categories}`);

	let xDataType;

	if (Object.prototype.toString.call(graphic_data[0].date) === '[object Date]') {
		xDataType = 'date';
	} else {
		xDataType = 'numeric';
	}

	// console.log(xDataType)

	// Define the x and y scales

	let x;

	if (xDataType == 'date') {
		x = d3.scaleTime()
			.domain(d3.extent(graphic_data, (d) => d.date))
			.range([0, width]);
	} else {
		x = d3.scaleLinear()
			.domain(d3.extent(graphic_data, (d) => +d.date))
			.range([0, width]);
	}
	//console.log(`x defined`);

	const y = d3
		.scaleLinear()
		.range([height, 0]);

	if (config.essential.yDomain == "auto") {
		let minY = d3.min(graphic_data, (d) => Math.min(...categories.map((c) => d[c])))
		let maxY = d3.max(graphic_data, (d) => Math.max(...categories.map((c) => d[c])))
		y.domain([minY, maxY])
		console.log(minY, maxY)
	} else {
		y.domain(config.essential.yDomain)
	}


	// Create an SVG element
	const svg = addSvg({
		svgParent: graphic,
		chart_width: parseInt(graphic.style('width')) - margin.left - margin.right,
		height: height + margin.top + margin.bottom,
		margin: margin
	})
	//console.log(`SVG element created`);

	const lastDatum = graphic_data[graphic_data.length - 1];
	const firstDatum = graphic_data[0];

	// Add the x-axis
	svg
		.append('g')
		.attr('class', 'x axis')
		.attr('transform', "translate(0," + (height + 5) + ")")
		.call(
			d3
				.axisTop(x)
				// .tickValues(tickValues)
				.tickFormat((d) => xDataType == 'date' ? d3.timeFormat(config.essential.xAxisTickFormat[size])(d)
					: d3.format(config.essential.xAxisNumberFormat)(d))
				.tickValues([firstDatum.date, lastDatum.date])
				.tickSize(height + 10)
		);

	// Add text labels to the right of the circles
	let xOffset = 8;
	let text_length;
	let rightWrapWidth = parseInt(graphic.style('width')) - margin.left - width - xOffset - 75;

	//Calculating where to place the category label
	function textLength(thing) {
		// text_length = thing._groups[0][0].clientWidth + xOffset; <-- this has some issues once in Florence/live - better method below
		text_length = thing.node().getComputedTextLength() + xOffset;

	}

	// create lines and circles for each category
	categories.forEach(function (category) {
		const lineGenerator = d3
			.line()
			.x((d) => x(d.date))
			.y((d) => y(d[category]))
			.curve(d3[config.essential.lineCurveType]) // I used bracket notation here to access the curve type as it's a string
			.context(null);
		// console.log(`Line generator created for category: ${category}`);

		svg
			.append('path')
			.datum(graphic_data)
			.attr('fill', 'none')
			.attr(
				'stroke',
				config.essential.colour_palette[
				categories.indexOf(category) % config.essential.colour_palette.length
				]
			)
			.attr('stroke-width', 3)
			.attr('d', lineGenerator)
			.style('stroke-linejoin', 'round')
			.style('stroke-linecap', 'round');
		//console.log(`Path appended for category: ${category}`);

		// Add text labels to the right of the circles
		svg
			.append('text')
			.attr(
				'transform',
				`translate(${x(lastDatum.date)}, ${y(lastDatum[category])})`
			)
			.attr('x', xOffset)
			.attr('dy', '.35em')
			.attr('text-anchor', 'start')
			.attr(
				'fill',
				config.essential.colour_palette_text[
				categories.indexOf(category) % config.essential.colour_palette_text.length
				]
			)
			.text(d3.format(config.essential.yAxisNumberFormat)((lastDatum[category]))) /* (Math.round((lastDatum[category]) / 100) * 100) */
			.attr('id', 'lastDateLabel')
			.attr("class", "directLineLabelBold")
			.call(textLength, this) //Work out the width of this bit of text for positioning the next bit
			.append('tspan')
			.attr('x', xOffset + text_length)
			.attr('dy', '.35em')
			.attr('text-anchor', 'start')
			.attr(
				'fill',
				config.essential.colour_palette_text[
				categories.indexOf(category) % config.essential.colour_palette_text.length
				]
			)
			.text(category)
			.attr("class", "directLineLabelRegular")
			.call(wrap, rightWrapWidth); //wrap function for the direct labelling.

		//Add text labels to the left of the first circles
		svg
			.append('text')
			.attr(
				'transform',
				`translate(${x(firstDatum.date)}, ${y(firstDatum[category])})`
			)
			.attr('x', -xOffset)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'end')
			.attr(
				'fill',
				config.essential.colour_palette_text[
				categories.indexOf(category) % config.essential.colour_palette_text.length
				]
			)
			.text(d3.format(config.essential.yAxisNumberFormat)(firstDatum[category]))
			.attr("class", "directLineLabelBold")

		//Add the circles
		svg
			.append('circle')
			.attr('cx', x(firstDatum.date))
			.attr('cy', y(firstDatum[category]))
			.attr('r', 4)
			.attr(
				'fill',
				config.essential.colour_palette[
				categories.indexOf(category) % config.essential.colour_palette.length
				]
			);
		svg
			.append('circle')
			.attr('cx', x(lastDatum.date))
			.attr('cy', y(lastDatum[category]))
			.attr('r', 4)
			.attr(
				'fill',
				config.essential.colour_palette[
				categories.indexOf(category) % config.essential.colour_palette.length
				]
			);
		// console.log(`Circle appended for category: ${category}`);

	});

	// add grid lines to y axis
	svg
		.append('g')
		.attr('class', 'grid')
		.call(
			d3
				.axisLeft(y)
				.tickValues([0])
				.tickSize(-width)
				.tickFormat('')
		)
		.lower();

	d3.selectAll('g.tick line')
		.each(function (e) {
			if (e == 0) {
				d3.select(this).attr('class', 'zero-line');
			}
		})

	// // Add the y-axis
	// svg
	// 	.append('g')
	// 	.attr('class', 'y axis')
	// 	.call(d3.axisRight(y).ticks(config.optional.yAxisTicks[size])
	// 		.tickValues([])
	// 		.tickFormat(d3.format(config.essential.yAxisNumberFormat)))
	// 	.attr('transform', "translate(" + margin.left + ", 0)");

	//create link to source
	d3.select('#source').text('Source: ' + config.essential.sourceText);
	// console.log(`Link to source created`);

	//use pym to calculate chart dimensions
	if (pymChild) {
		pymChild.sendHeight();
	}
	// console.log(`PymChild height sent`);
}


// Load the data
d3.csv(config.essential.graphic_data_url).then((rawData) => {
	graphic_data = rawData.map((d) => {
		if (d3.timeParse(config.essential.dateFormat)(d.date) !== null) {
			return {
				date: d3.timeParse(config.essential.dateFormat)(d.date),
				...Object.entries(d)
					.filter(([key]) => key !== 'date')
					.map(([key, value]) => [key, +value])
					.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
			}
		} else {
			return {
				date: (+d.date),
				...Object.entries(d)
					.filter(([key]) => key !== 'date')
					.map(([key, value]) => [key, +value])
					.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
			}
		}
	});

	// console.log(graphic_data);

	// console.log(`Data from CSV processed`);

	// console.log('Final data structure:');
	// console.log(graphic_data);

	// Use pym to create an iframed chart dependent on specified variables
	pymChild = new pym.Child({
		renderCallback: drawGraphic
	});
	// console.log(`PymChild created with renderCallback to drawGraphic`);
});
