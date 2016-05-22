# FoodBook

A simple social network for helping each other to find good food at good prices. Built for the vanhachathon challenge.

*Disclaimer*: This project uses [dispatchjs](https://github.com/lsmoura/dispatchjs.git). A nodejs library for handling and dispatching HTTP requests, created by the same author.

## Instructions

Create the sqlite database using the `database.sql` file. Save it to `foodbook.db`.

## Considerations

* This code was built with functionality in mind, not security.
* There is little interaction with developer and customer in a hackathon, so not everything will seem to be "the way the client wants".
* The database of choice was sqlite for its simplicity. It would not be feasible to use such database on a production environment with more than a few hundred users, but the system can easily be converted to be used in any SQL environment, or even no-SQL with a few tweaks.
* Product editing is not implemented. Since many "hosts" may be using the same product, it's not wise to let everyone edit the products. That should be done by a superuser (administrator? moderator? collaborator?). For now, this can be done directly on the database.
* Hosts are added manually on the database.

## Author

Sergio Moura <sergio@moura.us>

## License

MIT