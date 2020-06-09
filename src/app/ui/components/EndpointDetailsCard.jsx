import React from 'react'
import { Grid, Paper, Typography } from '@material-ui/core'

export default function EndpointCardDetails({ details }) {
	return (
		<Paper>
			<Grid container spacing={3}>
				<Grid item xs={6} sm={6} className="card-inner-grid" zeroMinWidth>
					{details.map(({ title }) => (
						<Typography color="textPrimary" variant="subtitle2" noWrap key={title}>
							<b> {title} </b>
						</Typography>
					))}
				</Grid>
				<Grid item xs={6} sm={6} className="card-inner-grid">
					{details.map(({ title, value }) => (
						<Typography color="textSecondary" variant="subtitle2" noWrap key={title} title={value}>
							{value}
						</Typography>
					))}
				</Grid>
			</Grid>
		</Paper>
	)
}
