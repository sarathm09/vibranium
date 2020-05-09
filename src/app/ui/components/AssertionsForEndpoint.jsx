import React from 'react'
import { green, red } from '@material-ui/core/colors'
import { CheckCircleOutline, Cancel } from '@material-ui/icons'
import { Grid, Paper, Table, TableRow, TableCell, TableBody, TableHead, Typography } from '@material-ui/core'

const getValueAsString = value => {
	if (value) {
		if (typeof value === 'object') return JSON.stringify(a.obtained)
		if (typeof value === 'boolean') return value ? 'True' : 'False'
		if (typeof value === 'number') return Number.isInteger(value) ? value : value.toFixed(3)

		return value
	} else {
		return '-'
	}
}

export default function AssertionsForEndpoint({ assertions }) {
	return !!assertions && assertions.length > 0 ? (
		<Grid container>
			<Grid item sm={12}>
				<Typography color="textSecondary" variant="subtitle2" style={{ margin: '5px 0px 7px 0px' }}>
					Assertions
				</Typography>
			</Grid>
			<Grid item sm={12}>
				<Paper elevation={3}>
					<Grid container>
						<Grid item sm={12}>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell> Assertion </TableCell>
										<TableCell> Expected </TableCell>
										<TableCell> Obtained </TableCell>
										<TableCell> Status </TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{assertions.map((a, index) => (
										<TableRow key={index}>
											<TableCell style={{ maxWidth: '20rem' }} component="td">
												{a.test || '-'}
											</TableCell>
											<TableCell style={{ maxWidth: '20rem' }} component="td">
												{a.expected || '-'}
											</TableCell>
											<TableCell style={{ maxWidth: '20rem' }} component="td">
												{getValueAsString(a.obtained)}
											</TableCell>
											<TableCell style={{ maxWidth: '20rem' }} component="td">
												{a.result ? <CheckCircleOutline style={{ color: green[500] }} /> : <Cancel style={{ color: red[500] }} />}
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
