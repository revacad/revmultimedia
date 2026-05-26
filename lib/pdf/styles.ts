import { StyleSheet } from '@react-pdf/renderer'

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1A1A2E',
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#C74A86',
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoSpacing: {
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  brandRev: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C74A86',
  },
  brandMultimedia: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  brandWordmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 6,
    color: '#1A1A2E',
  },
  brand: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C74A86',
  },
  muted: {
    color: '#5A5A7A',
    fontSize: 9,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#9898B8',
    width: '40%',
  },
  value: {
    width: '58%',
    textAlign: 'right',
  },
  totalBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F7F8FC',
    borderRadius: 4,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C74A86',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 48,
    right: 48,
    fontSize: 8,
    color: '#9898B8',
    textAlign: 'center',
  },
})
