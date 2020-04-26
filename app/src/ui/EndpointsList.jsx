import React, { useEffect } from 'react'
import { Typography, Table, TableCell, TableBody, TablePagination, TableSortLabel, 
	Paper, TableHead, TableContainer, TableRow, Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { red, green, grey } from '@material-ui/core/colors'
import { CheckCircleOutline, Cancel } from '@material-ui/icons'

import { navigate } from '@reach/router'
import ms from 'pretty-ms'

import Layout from './components/Layout'

const useStyles = makeStyles({
	table: {
		minWidth: 650
	},
	visuallyHidden: {
		border: 0,
		clip: 'rect(0 0 0 0)',
		height: 1,
		margin: -1,
		overflow: 'hidden',
		padding: 0,
		position: 'absolute',
		top: 20,
		width: 1
	},
	heading: {
		marginBottom: '1.5rem',
		marginBottom: '0.5rem',
		color: grey[800]
	}
})

const numericHeaders = ['time', 'index'],
	tableHeaders = [
		{
			title: 'Endpoint',
			key: 'name'
		},
		{
			title: 'Url',
			key: 'url'
		},
		{
			title: 'Scenario',
			key: 'scenario'
		},
		{
			title: 'Collection',
			key: 'collection'
		},
		{
			title: 'Time Taken',
			key: 'time'
		},
		{
			title: 'Status',
			key: 'status'
		}
	]

export default function EndpointsList({ jobId }) {
	const classes = useStyles()
	const [rowsPerPage, setRowsPerPage] = React.useState(25)
	const [page, setPage] = React.useState(0)
	const [tableData, setTableData] = React.useState([])
	const [sortOrder, setSortOrder] = React.useState(-1)
	const [sortColumn, setSortColumn] = React.useState('name')

	useEffect(() => {
		const url = jobId ? `/jobs/${jobId}` : '/apis'
		fetch(url)
			.then(data => data.json())
			.then(data => setTableData(data))
	}, [])

	const sortRows = column => {
		if (sortColumn === column) {
			setSortOrder(-1 * sortOrder)
		} else {
			setSortColumn(column)
			setSortOrder(-1 * sortOrder)
		}
	}

	const handleChangeRowsPerPage = event => {
		const value = isNaN(event.target.value) ? tableData.length : event.target.value
		setRowsPerPage(parseInt(value, 10))
		setPage(0)
	}

	const handleChangePage = (event, newPage) => {
		setPage(newPage)
	}

	const sortTableData = () =>
		tableData.sort((a, b) => {
			const parseValues = numericHeaders.includes(sortColumn)
			let parsedA = !parseValues ? a[sortColumn] : parseFloat(a[sortColumn])
			let parsedB = !parseValues ? b[sortColumn] : parseFloat(b[sortColumn])
			return parsedA < parsedB ? sortOrder : -1 * sortOrder
		})

	return (
		<Layout jobId={jobId}>
			<Grid container>
				<Grid item sm={12} className={classes.heading}>
					<Typography variant="subtitle1">
						Endpoints in Job #{jobId} ({tableData.length})
					</Typography>
				</Grid>
			</Grid>
			<TableContainer component={Paper}>
				<Table className={classes.table} aria-label="endpoints table">
					<TableHead>
						<TableRow>
							{tableHeaders.map(header => (
								<TableCell key={header.key} align={numericHeaders.includes(header.key) ? 'right' : 'left'}>
									<TableSortLabel
										onClick={() => sortRows(header.key)}
										active={sortColumn === header.key}
										direction={sortColumn === header.key ? (sortOrder == 1 ? 'asc' : 'desc') : 'asc'}
									>
										{header.title}{' '}
										{sortColumn === header.key ? (
											<span className={classes.visuallyHidden}> {sortOrder === 1 ? 'sorted descending' : 'sorted ascending'}</span>
										) : null}
									</TableSortLabel>
								</TableCell>
							))}
						</TableRow>
					</TableHead>

					<TableBody>
						{sortTableData()
							.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
							.map((row, index) => (
								<TableRow key={row._id} onClick={() => navigate(`/ui/jobs/${jobId}/apis/${row._id}`)}>
									{tableHeaders.map(header => (
										<TableCell key={header.key} component="td" scope="row" align={numericHeaders.includes(header.key) ? 'right' : 'left'}>
											{typeof row[header.key] === 'boolean' ? (
												!!row[header.key] ? (
													<CheckCircleOutline style={{ color: green[500] }} />
												) : (
													<Cancel style={{ color: red[500] }} />
												)
											) : header.key === 'time' && !isNaN(row[header.key]) ? (
												ms(row[header.key])
											) : (
												row[header.key]
											)}
										</TableCell>
									))}
								</TableRow>
							))}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				rowsPerPageOptions={[25, 50, 100, `All (${tableData.length})`]}
				component="div"
				count={tableData.length}
				rowsPerPage={rowsPerPage}
				page={page}
				onChangePage={handleChangePage}
				onChangeRowsPerPage={handleChangeRowsPerPage}
			/>
		</Layout>
	)
}
