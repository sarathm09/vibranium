import React, { useState, useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid, Paper, Typography } from '@material-ui/core'
import * as chart from 'recharts'

const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = chart

const useStyles = makeStyles(theme => ({
	paperTitle: {
		margin: '5px 0px 7px 0px'
	}
}))

export default function EndpointResponseTimeChart({ endpointName }) {
	let [graphData, setGraphData] = useState([])
	const classes = useStyles()

	useEffect(() => {
		if (!!endpointName) {
			fetch(`/apis?name=${endpointName}&select=jobId,_result.timing`)
				.then(data => data.json())
				.then(data => {
					let timingData = data.map(d => {
						return {
							jobId: d.jobId,
							...Object.entries(d._result.timing)
								.map(([key, val]) => [key, val.toFixed(2)])
								.reduce((a, c) => {
									a[c[0]] = c[1]
									return a
								}, {})
						}
					})
					setGraphData(timingData)
				})
		}
	}, [endpointName])

	return (
		<Grid container>
			<Grid item sm={12}>
				<Typography color="textSecondary" variant="subtitle2" className={classes.paperTitle}>
					Time taken by the API in the past {graphData.length} tests
				</Typography>
			</Grid>
			<Grid item sm={12}>
				<Paper>
					<ResponsiveContainer width="100%" aspect={7.0 / 3.0}>
						<LineChart width={25} height={10} data={graphData}>
							<CartesianGrid strokeDasharray="3 7" />
							<Tooltip />
							<Legend />
							<YAxis name="time (ms)" />
							<XAxis dataKey="jobId" />
							<Line type="monotone" dataKey="total" stroke="#003f5c" />
							<Line type="monotone" dataKey="wait" stroke="#2f4b7c" />
							<Line type="monotone" dataKey="dns" stroke="#665191" />
							<Line type="monotone" dataKey="tcp" stroke="#a05195" />
							<Line type="monotone" dataKey="firstByte" stroke="#f95d6a" />
							<Line type="monotone" dataKey="download" stroke="#ffa600" />
						</LineChart>
					</ResponsiveContainer>
				</Paper>
			</Grid>
		</Grid>
	)
}
