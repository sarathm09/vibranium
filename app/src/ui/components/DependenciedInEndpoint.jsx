import React from 'react'
import { Grid, Paper, Table, TableRow, TableCell, TableBody, TableHead, Typography } from '@material-ui/core'
import { CheckCircleOutline, Cancel } from '@material-ui/icons'
import { green, red } from '@material-ui/core/colors'

const getValueAsString = value => {
	if (value) {
		if (typeof value === 'object') return JSON.stringify(a.obtained)
		if (typeof value === 'boolean') return value ? 'True' : 'False'
		if (typeof value === 'number') return value.toFixed(5)

		return value
	} else {
		return '-'
	}
}

export default function DependenciesForEndpoint({ dependencies }) {
	return !!dependencies && dependencies.length > 0 ? (
		<Grid container>
			<Grid item sm={12}>
				<Typography color="textSecondary" variant="subtitle2" style={{ margin: '5px 0px 7px 0px' }}>
					Dependencies
				</Typography>
			</Grid>
			<Grid item sm={12}>
				<Paper elevation={3}>
					<Grid container>
						<Grid item sm={12}>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell> Name </TableCell>
										<TableCell> Scenario </TableCell>
										<TableCell> Collection </TableCell>
										<TableCell> Status </TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{dependencies.map((d, index) => (
										<TableRow key={index}>
											<TableCell component="td">{d.api || '-'}</TableCell>
											<TableCell component="td">{d.scenario || '-'}</TableCell>
											<TableCell component="td">{d.collection || '-'}</TableCell>
											<TableCell component="td">
												{d._result._status ? <CheckCircleOutline style={{ color: green[500] }} /> : <Cancel style={{ color: red[500] }} />}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Grid>
					</Grid>
				</Paper>
			</Grid>
		</Grid>
	) : null
}
