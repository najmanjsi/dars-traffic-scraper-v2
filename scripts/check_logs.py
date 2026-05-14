# let's check if there's an error in the logs somewhere

LOG_FILE_PATH = '../data/data/logs/scraper.log'
USUAL_NUMBER_OF_ROWS = 13794
CHECK_FROM_LINE = 14_000

with open(LOG_FILE_PATH) as f:
    
    # we're only checking the minutes, it would be better to check the whole timestamp
    # but for the sake of simplicity I'm doing it like this
    prev_minute = None

    print_error = False
    number_of_new_errors = 0

    number_of_errors = 0
    number_of_error_errors = 0
    number_of_wrong_timestamps = 0

    for i, line in enumerate(f):

        if CHECK_FROM_LINE > -1:
            if i > CHECK_FROM_LINE:
                print_error = True

        timestamp, status, info = line.strip().split(' | ')
        add_info = f'in line {i + 1} (status {status}, time {timestamp})'

        info_pieces = info.strip().split()

        if status != 'INFO':
            if print_error:
                print(f'Something went wrong {add_info}.')
                number_of_new_errors += 1
            number_of_errors += 1
            number_of_error_errors += 1
        elif (i + 1 + number_of_error_errors) % 2 == 0:
            #
            if len(info_pieces) != 3:
                if print_error:
                    print(f'Unusual information formating ("{info}") {add_info}')
                    pass # should add number of new errors butttt that's actually not the best
                number_of_errors += 1
                number_of_error_errors += 1
            else:
                _, number_of_rows, _ = info_pieces
                if int(number_of_rows) != USUAL_NUMBER_OF_ROWS:
                    if print_error:
                        print(f'Did not save the usual amount of rows (saved {number_of_rows}) {add_info}.')
                        pass # again, the same thing as with previous one
                    number_of_errors += 1
            
        else:
            if len(info_pieces) != 5:
                if print_error:
                    print(f'Unusual information formating ("{info}") {add_info}')
                    pass # same as above
                number_of_errors += 1
                number_of_error_errors += 1

        date, time = timestamp.strip().split()
        hour, minute, second = time.strip().split(':')
        hour = int(hour)
        minute = int(minute)
        #second = float(second)

        if (i + 1 + number_of_error_errors) % 2 == 0:
            if (prev_minute is not None) and (not prev_minute == minute):
                #print(f'Timestamp sequence wrong {add_info}.')
                number_of_wrong_timestamps += 1
        else:
            if (prev_minute is not None) and (not (prev_minute + 5) % 60 == minute):
                #print(f'Timestamp sequence wrong {add_info}.')
                number_of_wrong_timestamps += 1
        
        prev_minute = minute
        
    print(f'Checked whole log file ({i} lines), found {number_of_new_errors} errors.')
