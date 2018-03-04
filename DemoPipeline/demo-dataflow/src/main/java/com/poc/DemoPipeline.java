
package com.poc;


import com.poc.common.*;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.ValueProvider;


public class DemoPipeline{

    public interface DemoOptions extends PipelineOptions {
        @Description("Table spec to write the output to")
        ValueProvider<String> getOutputTableSpec();

        void setOutputTableSpec(ValueProvider<String> value);

        @Description("Pub/Sub topic to read the input from")
        ValueProvider<String> getInputTopic();

        void setInputTopic(ValueProvider<String> value);
    }

    public static void main(String[] args) {
        DemoOptions options = PipelineOptionsFactory.fromArgs(args).withValidation().as(DemoOptions.class);
        Pipeline pipeline = Pipeline.create(options);
        final ValueProvider<String> tableSpec = options.getOutputTableSpec();

        pipeline.apply("ReadPubsub", PubsubIO.readStrings().fromTopic(options.getInputTopic()))
                .apply(BigQueryConverters.jsonToTableRow()).apply("WriteBigQuery",
                        BigQueryIO.writeTableRows().withoutValidation()
                                .withCreateDisposition(BigQueryIO.Write.CreateDisposition.CREATE_NEVER)
                                .to(options.getOutputTableSpec()));

        pipeline.run();
    }

}