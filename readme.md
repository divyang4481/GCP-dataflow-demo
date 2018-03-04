1. This demo application is divided in following  component


1. Client application ( e.g. shopping cart)  using  App engine

2. Data collector  using  App engine and pubsub

3. Demo pipeline using  pubsub , dataflow and bigquery

    

Client application load "https://storage.googleapis.com/staticdemo/sp.min.js" file  to  send user events  to data collector. 

Then data collector will publish this data to pubsub topic

then demo pipeline will subscribe that topic and use as stream to transform json event data into bigquery