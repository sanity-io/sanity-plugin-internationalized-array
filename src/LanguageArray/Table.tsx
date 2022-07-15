import React from 'react'
import styled, {css} from 'styled-components'
import {Box, Card} from '@sanity/ui'

export const TableWrapper = styled(Box)(
  () =>
    css`
      display: table;
    `
)

type TableProps = {
  children: React.ReactNode
  [key: string]: unknown
}

export function Table(props: TableProps) {
  const {children, ...rest} = props

  return (
    <TableWrapper as="table" {...rest}>
      {children}
    </TableWrapper>
  )
}

export const Row = styled(Card)(
  () =>
    css`
      display: table-row;

      &:not([hidden]) {
        display: table-row;
      }
    `
)

type TableRowProps = {
  children: React.ReactNode
  [key: string]: unknown
}

export function TableRow(props: TableRowProps) {
  const {children, ...rest} = props

  return (
    <Row as="tr" {...rest}>
      {children}
    </Row>
  )
}

export const Cell = styled(Box)(
  () =>
    css`
      display: table-cell;
    `
)

type TableCellProps = {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function TableCell(props: TableCellProps) {
  const {children, style} = props

  return (
    <Cell as="td" style={style}>
      {children}
    </Cell>
  )
}
